'use strict';
const {CoreProcessorIntake, CommonErrorCodes, AWSTransactionalWriteService, AWSDynamoTokenService, AWSDynamoUnderlyingTransactionService, AWSDynamoGlobalAddressService}
    = require("@payburner/keyburner-sidewinder-core/dist/npm");
let AWS = require('aws-sdk');
module.exports.process = async event => {

    const docClient = new AWS.DynamoDB.DocumentClient();
    const tokenService = new AWSDynamoTokenService(docClient);
    const globalAddressService = new AWSDynamoGlobalAddressService(docClient);
    const transactionalWriteService = new AWSTransactionalWriteService(
        docClient);
    const underlyingTransactionService = new AWSDynamoUnderlyingTransactionService(docClient);
    const coreProcessor = new CoreProcessorIntake(globalAddressService,
        tokenService, underlyingTransactionService);
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

            let id = 'NO_TXN_ID';
            if (typeof response.decodedTransaction !== 'undefined') {
                id = response.decodedTransaction.id;
            }
            response.serviceResponse.id = id;

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
        console.log('Processing error:' + error);
        console.log('Processing error:' + JSON.stringify(error, null, 2));
        return {
            statusCode: 500,
            body: JSON.stringify(CommonErrorCodes.SYSTEM_PROBLEM_UNKNOWN)
        };
    }

};

