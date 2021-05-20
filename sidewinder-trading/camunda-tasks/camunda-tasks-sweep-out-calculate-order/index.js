const {
    Client,
    logger,
    Variables,
    BasicAuthInterceptor
} = require("camunda-external-task-client-js");
const uuid4 = require('uuid4');
const fs = require('fs');

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


// susbscribe to the topic: 'creditScoreChecker'
client.subscribe("SweepOutCalculateOrder", async function ({task, taskService}) {
    console.log('TASK:' + JSON.stringify(task.variables.getAll(), null, 2));
    const input = task.variables.getAll();

    try {
        console.log('Return Success');
        const symbol = input.target_currency + '/' + input.source_currency;
        const processVariables = new Variables().set("status", 'DONE')
            .set("side-" + input.loopCounter, "buy")
            .set("symbol-" + input.loopCounter, input.target_currency + '/' + input.source_currency)
            .set("business_key-" + input.loopCounter, 'instant-order-' + input.target_address + '-'
                + input.exchange + '-' + symbol + '-' + uuid4());
        const localVariables = new Variables();
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