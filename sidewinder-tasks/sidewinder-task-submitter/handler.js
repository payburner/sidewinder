'use strict';
const aws = require('aws-sdk');
const {SidewinderTaskService} = require("@payburner/sidewinder-tasks-client/src/SidewinderTaskService");

module.exports.process = async event => {
    const sidewinder = new SidewinderTaskService();
    const stepfunctions = new aws.StepFunctions();
    sidewinder.newAddress();
    console.log('Event:' + JSON.stringify(event, null, 2));

    const input = typeof event.Input.StatePayload !== 'undefined' ? event.Input.StatePayload: event.Input;

    const taskPushResponse = await sidewinder.pushTaskRequest(input.target_address, input.task_type, input.request_payload);

    console.log('Task Create Response:' + JSON.stringify(taskPushResponse, null, 2));

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

