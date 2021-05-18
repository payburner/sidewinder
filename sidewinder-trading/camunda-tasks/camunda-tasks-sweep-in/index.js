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
client.subscribe("SweepIn", async function ({task, taskService}) {
    console.log('TASK:' + JSON.stringify(task.variables.getAll(), null, 2));
    const input = task.variables.getAll();

    try {

        const sourceCurrencies = input['source_currencies'].split(',');

        console.log('Return Success#');
        const processVariables = new Variables().set("status", 'DONE')
            .setTyped("source_currencies_list", {
                value: JSON.stringify(sourceCurrencies),
                type: 'Object',
                valueInfo: {
                    "serializationDataFormat": "application/json",
                    "objectTypeName": "java.util.ArrayList"
                }
            });
        console.log('Vars:' + JSON.stringify(processVariables.getAll(), null, 2));
        // set a local variable 'winningDate'
        const localVariables = new Variables();
        await taskService.complete(task, processVariables, localVariables);
        return

    } catch (error) {
        console.log('ERROR');
        console.log('error:' + error);
        console.log(error);

        await taskService.handleBpmnError(task, "save_failed", JSON.stringify(error), new Variables().set("status", 'FAILED'));

    }

});