'use strict';
const {CoreProcessor2, CommonErrorCodes, AWSTransactionalWriteService, AWSDynamoTokenService, AWSDynamoGlobalAddressService}
    = require("@payburner/keyburner-sidewinder-core/dist/npm");
var AWS = require('aws-sdk');
module.exports.process = async event => {

    const docClient = new AWS.DynamoDB.DocumentClient();
    const tokenService = new AWSDynamoTokenService(docClient);
    const globalAddressService = new AWSDynamoGlobalAddressService(docClient);
    const transactionalWriteService = new AWSTransactionalWriteService(
        docClient);
    const coreProcessor = new CoreProcessor2(globalAddressService,
        tokenService);
    const t0 = new Date().getTime();
    try {
        const response = await
            coreProcessor.decodeAndProcessTransaction(event.body);
        console.info(
            "Time to Decode and Process:" + (new Date().getTime()
            - t0));
        const wrote = await transactionalWriteService.write(response.transactionItems);

        if (wrote) {
            console.log('Time to Write:' + wrote + ' '
                + (new Date().getTime() - t0) );
            return ({
                statusCode: response.serviceResponse.status,
                body: JSON.stringify(response.serviceResponse)
            });
        }
        else {
            console.log('Failed to Write:' + wrote + ' '
                + (new Date().getTime() - t0) );
            return {
                statusCode: 400,
                body: JSON.stringify(CommonErrorCodes.TRANSACTION_INVALID)
            };
        }
    }
    catch(error) {
        return {
            statusCode: 500,
            body: JSON.stringify(CommonErrorCodes.SYSTEM_PROBLEM_UNKNOWN)
        };
    }

};

