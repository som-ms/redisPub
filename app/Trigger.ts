import { Publisher } from './Publisher';

class Trigger {

    runProcess(): void {
        let cmdArgs = process.argv.slice(2);
        let firstChannelId: number = Number(cmdArgs[0]);
        (new Publisher(firstChannelId)).initiateTask();
    }
}

let abc = new Trigger();
abc.runProcess();