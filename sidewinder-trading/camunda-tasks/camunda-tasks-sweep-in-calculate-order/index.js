const {
    Client,
    logger,
    Variables,
    BasicAuthInterceptor
} = require("camunda-external-task-client-js");
const AWS = require('aws-sdk');

const uuid4 = require('uuid4');
const fs = require('fs');
const {SidewinderOmsPersistenceService} = require("@payburner/sidewinder-trading-oms-p/src/SidewinderOmsPersistenceService");

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
const docClient = new AWS.DynamoDB.DocumentClient();
const p = new SidewinderOmsPersistenceService( docClient );


// susbscribe to the topic: 'creditScoreChecker'
client.subscribe("SweepInCalculateOrder", async function ({task, taskService}) {
    console.log('TASK:' + JSON.stringify(task.variables.getAll(), null, 2));
    const input = task.variables.getAll();

    try {

        const account = await p.getAccount( input.target_address, input.exchange, input.source_currency );
        if (account.status !== 200) {
            console.log('Failing, could not get account balance:' + JSON.stringify(account, null, 2));
            await taskService.handleBpmnError(task, "get_account_failed",
                JSON.stringify(account.error), new Variables().set("status", 'FAILED'));
            return;
        }
        console.log('Obtained account balance: ' + JSON.stringify(account, null, 2));
        const symbol = input.source_currency + '/' + input.target_currency;
        const processVariables = new Variables().set("status", 'DONE')
            .set("side", "sell")
            .set("amount", account.data.available )
            .set("symbol", input.source_currency + '/' + input.target_currency)
            .set("business_key", 'market-order-' + input.target_address + '-'
                + input.exchange + '-' + symbol + '-' + uuid4());
        const localVariables = new Variables()
        await taskService.complete(task, processVariables, localVariables);
        return;
    }
    catch(error) {
        console.log('ERROR');
        console.log('error:' + error);
        console.log(error);

        await taskService.handleBpmnError(task, "save_failed", JSON.stringify(error), new Variables().set("status", 'FAILED'));

    }

});