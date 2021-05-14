const {
    Client,
    logger,
    Variables,
    BasicAuthInterceptor
} = require("camunda-external-task-client-js");
const AWS = require('aws-sdk');
const {SidewinderOmsPersistenceService} = require("@payburner/sidewinder-trading-oms-p/src/SidewinderOmsPersistenceService");
const {SidewinderTaskService} = require("@payburner/sidewinder-tasks-client/src/SidewinderTaskService");

const fs = require('fs');
const uuid4 = require('uuid4');

const pConfig = JSON.parse(fs.readFileSync(process.argv[2]).toString());

const basicAuthentication = new BasicAuthInterceptor({
    username: pConfig.CAMUNDA_USER,
    password: pConfig.CAMUNDA_PASSWORD
});

// configuration for the Client:
//  - 'baseUrl': url to the Process Engine
//  - 'logger': utility to automatically log important events
const config = {
    interceptors: basicAuthentication,
    baseUrl: "https://oms.payburner.com/engine-rest",
    use: logger
};

// create a Client instance with custom configuration
const client = new Client(config);

AWS.config.update({
    accessKeyId: pConfig.AWS_ACCESS_ID,
    secretAccessKey: pConfig.AWS_ACCESS_KEY,
    region: pConfig.AWS_REGION
});
const docClient = new AWS.DynamoDB.DocumentClient();
const p = new SidewinderOmsPersistenceService(docClient);

const sidewinder = new SidewinderTaskService();
sidewinder.initializeAddress(pConfig.SIDEWINDER_SEED);

// susbscribe to the topic: 'creditScoreChecker'
client.subscribe("SweepOut", async function ({task, taskService}) {
    console.log('TASK:' + JSON.stringify(task.variables.getAll(), null, 2));
    const input = task.variables.getAll();

    const taskPushResponse = await sidewinder.pushAndAwait(input.target_address, 'CCXTFetchBalance', {
        exchange: input.exchange,
        target_address: input.target_address
    });
    const totals = taskPushResponse.data.task.response_payload.total;
    const balances = {
    };
    Object.keys(totals).forEach((currency) => {
        balances[currency] = taskPushResponse.data.task.response_payload[currency];
    });

    const minimumSourceCurrencyTrade = 30.00;
    const balanceSource = balances[input.source_currency].free;
    const targetCurrencies = input[target_currencies].split(',');

    const sourceAmountEachTarget = balanceSource / targetCurrencies.length;
    if (sourceAmountEachTarget < minimumSourceCurrencyTrade) {
        const processVariables = new Variables().set("status", 'FAILED').set("status_reason", "INSUFFICIENT SOURCE CURRENCY AVAILABLE BALANCE:" + balanceSource);
        // set a local variable 'winningDate'
        const localVariables = new Variables();
        await taskService.complete(task, processVariables, localVariables);
        return
    }
    else {

        const processVariables = new Variables().set("status", 'DONE').set("source_amount_each_target", sourceAmountEachTarget);
        // set a local variable 'winningDate'
        const localVariables = new Variables();
        await taskService.complete(task, processVariables, localVariables);
        return
    }

});