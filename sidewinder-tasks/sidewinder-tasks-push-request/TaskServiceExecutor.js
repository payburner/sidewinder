const {BotCore} = require( "@payburner/sidewinder-service/BotCore");
const md5 = require('md5');
const uuid4 = require('uuid4');
const AWS = require('aws-sdk');
class TaskServiceExecutor {

    constructor( executionHandler ) {
        this.docClient = new AWS.DynamoDB.DocumentClient()
        this.botCore = new BotCore();
        this.executionHandler = executionHandler;
    }

    async execute( event ) {

        let correlation_id = uuid4();
        if (typeof event.body.correlation_id !== 'undefined' && event.body.correlation_id !== null) {
            correlation_id = event.body.correlation_id;
        }
        console.log('#--> ' + this.executionHandler.name() + '-IN: PRE-DECODE');

        const decodedResponse = this.botCore.decodeAndVerify( event );
        if (decodedResponse.status !== 200) {
            decodedResponse.correlation_id = correlation_id;
            console.log('<--# ' + this.executionHandler.name() + '-OUT: Could not decode:'
              + JSON.stringify(decodedResponse, null, 2));
            return {
                statusCode: decodedResponse.status, correlation_id: correlation_id, body: JSON.stringify(decodedResponse)
            };
        }
        const address = decodedResponse.data.address;
        const request = decodedResponse.data.payload;
        console.log('-- ' + this.executionHandler.name() + '-IN: ' + JSON.stringify(request, null, 2));

        const response = await this.executionHandler.execute(correlation_id, address, request);
        console.log('<--# ' + this.executionHandler.name() + '-OUT: ' + JSON.stringify(response, null, 2));

        return response;
    }

}

module.exports.TaskServiceExecutor = TaskServiceExecutor;