'use strict';
const aws = require('aws-sdk');
const {SidewinderTaskService} = require("@payburner/sidewinder-tasks-client/src/SidewinderTaskService");

module.exports.process = async event => {
    const sidewinder = new SidewinderTaskService();
    const stepfunctions = new aws.StepFunctions();
    sidewinder.newAddress();
    console.log('Event:' + JSON.stringify(event, null, 2));

    const taskPushResponse = await sidewinder.pullTaskStatus(event.Input.data.task.task_id);

    console.log('Task Check Response:' + JSON.stringify(taskPushResponse, null, 2));

    const params = {
        output: JSON.stringify(taskPushResponse, null, 2),
        taskToken: event.TaskToken
    };

    console.log(`Calling Step Functions to complete callback task with params ${JSON.stringify(params)}`);

    return new Promise((resolve) => {
        stepfunctions.sendTaskSuccess(params, (err, data) => {
            if (err) {
                console.error(err.message);
                resolve(err.message);
                return;
            }
            console.log(data);
            resolve({
                statusCode: 200, body: JSON.stringify({ data: sidewinder.address() })
            });
        });
    })

};

