'use strict';

const {SidewinderTaskService} = require("@payburner/sidewinder-tasks-client/src/SidewinderTaskService");

module.exports.process = async event => {
    const sidewinder = new SidewinderTaskService();
   sidewinder.newAddress();
    console.log('Event:' + JSON.stringify(event, null, 2));

    const input = JSON.parse(event.body);

    return new Promise(async (resolve) => {
        const taskPushResponse = await sidewinder.pushAndAwait(input.target_address, input.task_type, input.request_payload);
        console.log('Task Execute Response:' + JSON.stringify(taskPushResponse, null, 2));
        resolve({
            statusCode: taskPushResponse.status, body: JSON.stringify(taskPushResponse)
        });
    });
};

