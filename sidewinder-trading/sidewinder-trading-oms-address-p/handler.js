'use strict';
const AWS = require('aws-sdk');
const {SidewinderOmsPersistenceService} = require("@payburner/sidewinder-trading-oms-p/src/SidewinderOmsPersistenceService");

module.exports.process = async event => {

    const stepfunctions = new AWS.StepFunctions();
    const docClient = new AWS.DynamoDB.DocumentClient();
    const p = new SidewinderOmsPersistenceService( docClient );

    console.log('Event:' + JSON.stringify(event, null, 2));

    const depositAddress = event.Input.Output.data.task.response_payload.address;
    const currency = event.Input.Output.data.task.request_payload.currency;
    const exchange = event.Input.Output.data.task.request_payload.exchange;
    const address = event.Input.Output.data.task.target_address;

    console.log('P:' + JSON.stringify(
        await p.saveDepositAddress( address, exchange, currency, depositAddress ), null, 2));


    const params = {
        output: JSON.stringify({}, null, 2),
        taskToken: event.TaskToken
    };

    return new Promise((resolve) => {
        stepfunctions.sendTaskSuccess(params, (err, data) => {
            if (err) {
                console.error(err.message);
                resolve(err.message);
                return;
            }
            console.log(data);
            resolve({
                statusCode: 200, body: JSON.stringify({status:200,data:{}})
            });
        });
    })

};

