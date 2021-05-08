'use strict';
const AWS = require('aws-sdk');
const {SidewinderOmsPersistenceService} = require("@payburner/sidewinder-trading-oms-p/src/SidewinderOmsPersistenceService");

module.exports.process = async event => {

    const stepfunctions = new AWS.StepFunctions();
    const docClient = new AWS.DynamoDB.DocumentClient();
    const p = new SidewinderOmsPersistenceService( docClient );

    console.log('Event:' + JSON.stringify(event, null, 2));

    const totals = event.Input.Output.data.task.response_payload.total;

    const balances = {

    };
    Object.keys(totals).forEach((currency) => {
        balances[currency] = event.Input.Output.data.task.response_payload[currency];
    });

    const exchange = event.Input.Output.data.task.request_payload.exchange;
    const address = event.Input.Output.data.task.target_address;
    const currencies = Object.keys(balances);
    for (let idx = 0; idx < currencies.length; idx++) {
        console.log('P:' + JSON.stringify(
            await p.saveBalance( address, exchange, currencies[idx], balances[currencies[idx]].total,
                balances[currencies[idx]].free, balances[currencies[idx]].used ), null, 2));
    }
    console.log('Input:' + JSON.stringify(totals, null, 2));
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

