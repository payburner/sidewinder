'use strict';
const {KeyBurner} = require( "@payburner/keyburner-core/dist/npm");
const {CoreProcessor2, CommonErrorCodes, AWSTransactionalWriteService, AWSDynamoTokenService, AWSDynamoGlobalAddressService}
    = require("@payburner/keyburner-sidewinder-core/dist/npm");
const {AWSDynamoUnderlyingTransactionService, AWSDynamoTransactionService, AWSDynamoEnvironmentBlockService} = require( "@payburner/keyburner-sidewinder-core/dist/npm");
const AWS = require('aws-sdk');

module.exports.process = async event => {

    // the seed is loaded from the secret manager.  The address is public...
    // in this way an
    // yone can verify the block but only the processor can sign
    // the block.

    const payload = JSON.parse(event.body);
    if (typeof payload.environment === 'undefined') {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 400, error: 'environment required in the body.'
            }),
        };
    }

    const docClient = new AWS.DynamoDB.DocumentClient();
    const transactionService = new AWSDynamoTransactionService(docClient);
    const blockService = new AWSDynamoEnvironmentBlockService(docClient);
    const underlyingTransactionService = new AWSDynamoUnderlyingTransactionService(docClient);
    // our first task is to load the transactions for the given environment.
    let array = await transactionService.getTransactionsByEnvironmentAndProcessingStage(payload.environment, 'PENDING');
    if (array.Items.length === 0) {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 200,
                block: { count: 0, sequence: -1 }
            }),
        };
    }

    let region = "us-west-1",
        secretName = "dev/environments/" + payload.environment;
    let client = new AWS.SecretsManager({
        region: region
    });
    let result = null;
    try {
        result = await new Promise((resolve, reject) => {
            client.getSecretValue({SecretId: secretName}, function (err, data) {

                if (err) {
                    console.log(err);
                    reject()
                } else {
                    resolve(JSON.parse(data.SecretString))
                }
            });
        });
    }
    catch(error) {
        return {
            statusCode: 403,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 403, error: 'The lambda is not authorized to process a block for this environment.'
            })
        };
    }

    const seed = result.seed;
    const keyburner = new KeyBurner();
    const keyPair = keyburner.deriveKeyPair(seed);
    const address = keyburner.deriveAddress(keyPair);
    console.log('Address:' + address);

     const preFilterLength = array.Items.length;
    array.Items = array.Items.filter((txn,i) => i < 5);

    let txns = array.Items.map((txn) => {
        return txn.raw
    });
    console.log('Items Returned:' + preFilterLength + ', Filtered:' + txns.length);

    // now we load the previous block for the environment, or set the id to 'NONE'
    // load from sidewinder_environment.

    const previousBlock = await blockService.getLatestEnvironmentBlock(payload.environment);

    console.log("PreviousBlock:" + JSON.stringify(previousBlock, null, 2));

    const lastBlockId = previousBlock.block_id;
    const previousSequence = previousBlock.sequence;
    const block = {
        environment: payload.environment,
        txns: txns,
        last_block_id: lastBlockId,
        sequence: lastBlockId === 'NONE' ? 0 : previousSequence + 1
    };

    // -- now we have an array....
    const signedBlock = keyburner.signTransaction(block, keyPair);

    // now lets persist the signed block to the sidewinder_blocks && sidewinder_environment
    // this means that you can query the
    const data = {
        block_id: signedBlock.id,
        block: signedBlock.signedTransaction,
        environment: block.environment,
        sequence: block.sequence,
        count: block.txns.length,
        last_block_id: block.last_block_id,
        timestamp: new Date().getTime()
    };

    const saved = await blockService.saveSignedBlock(array.Items, data);
    if (!saved) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 500, error: 'the block could not be saved.', block:data}),
        };
    }

    const tokenService = new AWSDynamoTokenService(docClient);
    const globalAddressService = new AWSDynamoGlobalAddressService(docClient);
    const transactionalWriteService = new AWSTransactionalWriteService(
        docClient);
    const coreProcessor = new CoreProcessor2(globalAddressService,
        tokenService, underlyingTransactionService);

    for (var idx in txns) {
        const t0 = new Date().getTime();
        try {
            const response = await
                coreProcessor.decodeAndProcessTransaction(txns[idx]);
            console.info(
                "Time to Decode and Process:" + (new Date().getTime()
                - t0));
            const wrote = await transactionalWriteService.write(response.transactionItems);

            if (wrote) {
                console.log('Time to Write:' + wrote + ' '
                    + (new Date().getTime() - t0) );
            }
            else {
                console.log('Failed to Write:' + wrote + ' '
                    + (new Date().getTime() - t0) );
            }
        }
        catch(error) {
            console.log('Processing error:' + error);
            console.log('Processing error:' + JSON.stringify(error, null, 2));
        }
    }



    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            status: 200,
            block: data
        }),
    };
};



