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

    try {
        console.log('Retrieving balances for:' + input.exchange );
        const taskPushResponse = await sidewinder.pushAndAwait(input.target_address, 'CCXTFetchBalance', {
            exchange: input.exchange,
            target_address: input.target_address
        });
        const totals = taskPushResponse.data.task.response_payload.total;
        const balances = {};
        Object.keys(totals).forEach((currency) => {
            balances[currency] = taskPushResponse.data.task.response_payload[currency];
        });
        console.log('Retrieved balance:' + JSON.stringify(balances, null, 2));
        const minimumSourceCurrencyTrade = 30.00;
        const balanceSource = balances[input.source_currency].free;
        const targetCurrencies = input['target_currencies'].split(',');
        const sourceAmountEachTarget =Math.floor(balanceSource / targetCurrencies.length* 100) / 100 ;
        console.log('Source Amount Each Target:' +  sourceAmountEachTarget );
        if (sourceAmountEachTarget < minimumSourceCurrencyTrade) {
            console.log('Return Failed');
            const processVariables = new Variables().set("status", 'FAILED').set("status_reason", "INSUFFICIENT SOURCE CURRENCY AVAILABLE BALANCE:" + balanceSource);
            // set a local variable 'winningDate'
            const localVariables = new Variables();
            await taskService.complete(task, processVariables, localVariables);
            return
        } else {
            console.log('Return Success#');
            const processVariables = new Variables().set("status", 'DONE')
                .set("amount", sourceAmountEachTarget)
                .setTyped("target_currencies_list", {
                    value: JSON.stringify(targetCurrencies),
                    type: 'Object',
                    valueInfo: { "serializationDataFormat": "application/json",
                        "objectTypeName": "java.util.ArrayList" }
                });
            console.log('Vars:' + JSON.stringify(processVariables.getAll(), null, 2));
            // set a local variable 'winningDate'
            const localVariables = new Variables();
            await taskService.complete(task, processVariables, localVariables);
            return
        }
    }
    catch(error) {
        console.log('ERROR');
        console.log('error:' + error);
        console.log(error);

        await taskService.handleBpmnError(task, "save_failed", JSON.stringify(error), new Variables().set("status", 'FAILED'));

    }

});