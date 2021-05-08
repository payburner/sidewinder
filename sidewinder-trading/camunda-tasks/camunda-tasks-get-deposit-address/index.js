const { Client, logger, Variables } = require("camunda-external-task-client-js");
const AWS = require('aws-sdk');
const {SidewinderTaskService} = require("@payburner/sidewinder-tasks-client/src/SidewinderTaskService");

const {SidewinderOmsPersistenceService} = require("@payburner/sidewinder-trading-oms-p/src/SidewinderOmsPersistenceService");
const fs = require('fs');
const uuid4 = require('uuid4');
// configuration for the Client:
//  - 'baseUrl': url to the Process Engine
//  - 'logger': utility to automatically log important events
const config = { baseUrl: "http://localhost:8080/engine-rest", use: logger };

// create a Client instance with custom configuration
const client = new Client(config);

const awsConfig = JSON.parse(fs.readFileSync('./config.json').toString());

AWS.config.update({
    accessKeyId: awsConfig.AWS_ACCESS_ID,
    secretAccessKey: awsConfig.AWS_ACCESS_KEY,
    region: awsConfig.AWS_REGION
});
const sidewinder = new SidewinderTaskService();
sidewinder.newAddress();
const docClient = new AWS.DynamoDB.DocumentClient();
const p = new SidewinderOmsPersistenceService( docClient );

// susbscribe to the topic: 'creditScoreChecker'
client.subscribe("GetDepositAddress", async function({ task, taskService }) {
    console.log('TASK:' + JSON.stringify(task.variables.getAll(), null,2));
    const input = task.variables.getAll();
    const taskPushResponse = await sidewinder.pushAndAwait(input.target_address, 'CCXTFetchDepositAddress', {
        exchange: input.exchange,
        currency: input.currency,
        target_address: input.target_address
    });
    const depositAddress = taskPushResponse.data.task.response_payload.address;
    const currency = taskPushResponse.data.task.request_payload.currency;
    const exchange = taskPushResponse.data.task.request_payload.exchange;
    const address = taskPushResponse.data.task.target_address;
    console.log('P:' + JSON.stringify(
        await p.saveDepositAddress( address, exchange, currency, depositAddress ), null, 2));

    const processVariables = new Variables().set("status", 'NOT_DONE');
    // set a local variable 'winningDate'
    const localVariables = new Variables();
    await taskService.complete(task, processVariables, localVariables);
});