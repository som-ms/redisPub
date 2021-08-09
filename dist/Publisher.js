"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Publisher = void 0;
const Constants_1 = require("./Constants");
const Message_1 = require("./Message");
const appInsight = __importStar(require("applicationinsights"));
const MyRedisCluster_1 = require("./MyRedisCluster");
class Publisher {
    constructor(firstChannelId) {
        this.firstChannelId = firstChannelId;
        appInsight.setup().start();
        this.redisClient = new MyRedisCluster_1.MyRedisCluster().getRedisConnection();
        this.totalMessagesSent = new Array(Constants_1.Constants.TOTAL_CHANNEL_PER_PUBLISHER).fill(0);
        this.currentBatchCount = new Array(Constants_1.Constants.TOTAL_CHANNEL_PER_PUBLISHER).fill(0);
        this.sendStart = false;
    }
    publishMessage() {
        if (this.sendStart) {
            for (var i = 0; i < Constants_1.Constants.TOTAL_CHANNEL_PER_PUBLISHER; i++) {
                console.log("message to channel: " + i);
                var messageObj = new Message_1.Message(String(this.firstChannelId + i), this.totalMessagesSent[i]); // content is same as totalMessageSent
                this.redisClient.publish(String(this.firstChannelId + i), JSON.stringify(messageObj));
                this.totalMessagesSent[i]++;
                this.currentBatchCount[i]++;
            }
        }
    }
    initiateTask() {
        this.redisClient.on("ready", () => {
            appInsight.defaultClient.trackMetric({ name: "redisPubConnOpen", value: 1.0 });
            console.log("Redis connection Established");
            this.sendStart = true;
        });
        setInterval(this.publishMessage.bind(this), Constants_1.Constants.MESSAGE_PUBLISH_INTERVAL);
        setInterval(this.sendMetric.bind(this), Constants_1.Constants.METRIC_SENT_INTERVAL);
        process.on('SIGINT', () => __awaiter(this, void 0, void 0, function* () {
            console.log("shutting down gracefully.");
            this.sendMetric.bind(this);
            appInsight.defaultClient.flush();
            process.exit();
        }));
    }
    delay(ms) {
        // return new Promise(resolve => setTimeout(resolve, ms));
        return new Promise(resolve => setTimeout(() => resolve(), 10000)).then(() => console.log("fired"));
    }
    // myfunc() {
    //     console.log("exiting")
    // }
    // async waitForSomeTime(ms: number) {
    //     await new Promise<void>();
    //     // await new Promise<void>(resolve => setTimeout(() => resolve(), 10000)).then(() => console.log("fired"));
    // }
    sendMetric() {
        console.log("called sendMetric");
        if (this.sendStart) {
            for (var i = 0; i < Constants_1.Constants.TOTAL_CHANNEL_PER_PUBLISHER; i++) {
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
                this.currentBatchCount[i] = 0;
            }
        }
    }
}
exports.Publisher = Publisher;
//# sourceMappingURL=Publisher.js.map