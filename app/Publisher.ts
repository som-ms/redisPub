import { Constants } from './Constants';
import { Message } from './Message';
import * as appInsight from 'applicationinsights'
import { MyRedisCluster } from './MyRedisCluster';
import IORedis from 'ioredis';

export class Publisher {
    redisClient: IORedis.Cluster;
    totalMessagesSent: Array<number>;
    currentBatchCount: Array<number>;
    sendStart: boolean;
    constructor(public firstChannelId: number) {
        appInsight.setup().start();
        this.redisClient = new MyRedisCluster().getRedisConnection();
        this.totalMessagesSent = new Array(Constants.TOTAL_CHANNEL_PER_PUBLISHER).fill(0);
        this.currentBatchCount = new Array(Constants.TOTAL_CHANNEL_PER_PUBLISHER).fill(0);
        this.sendStart = false;
    }


    publishMessage(): void {
        if (this.sendStart) {
            for (var i: number = 0; i < Constants.TOTAL_CHANNEL_PER_PUBLISHER; i++) {
                console.log("message to channel: " + i);
                var messageObj = new Message(String(this.firstChannelId + i), this.totalMessagesSent[i]); // content is same as totalMessageSent
                this.redisClient.publish(String(this.firstChannelId + i), JSON.stringify(messageObj));
                this.totalMessagesSent[i]++;
                this.currentBatchCount[i]++;
            }
        }
    }

    initiateTask(runtime: number): void {
        this.redisClient.on("ready", () => {
            appInsight.defaultClient.trackMetric({ name: "redisPubConnOpen", value: 1.0 });
            console.log("Redis connection Established");
            this.sendStart = true;
        });
        setInterval(this.publishMessage.bind(this), Constants.MESSAGE_PUBLISH_INTERVAL);
        setInterval(this.sendMetric.bind(this), Constants.METRIC_SENT_INTERVAL);
        setInterval(this.stopTest.bind(this), runtime * 60 * 1000);
    }

    stopTest(): void {
        this.sendStart = false;
    }

    sendMetric(): void {
        for (var i: number = 0; i < Constants.TOTAL_CHANNEL_PER_PUBLISHER; i++) {
            var propertySet = {
                "TotalMessagesSent": this.totalMessagesSent[i],
                "channelId": this.firstChannelId + i
            };
            var metric = { "MessageBatchSent": this.currentBatchCount[i] };

            appInsight.defaultClient.trackEvent({
                name: "pubEvents",
                properties: propertySet,
                measurements: metric
            });
            appInsight.defaultClient.flush();
            this.currentBatchCount[i] = 0;
        }
    }

}

