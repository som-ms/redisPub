"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Publisher_1 = require("./Publisher");
class Trigger {
    runProcess() {
        let cmdArgs = process.argv.slice(2);
        let firstChannelId = Number(cmdArgs[0]);
        (new Publisher_1.Publisher(firstChannelId)).initiateTask();
    }
}
let abc = new Trigger();
abc.runProcess();
//# sourceMappingURL=Trigger.js.map