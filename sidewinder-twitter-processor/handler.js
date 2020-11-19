'use strict';

const AWS = require('aws-sdk');
const {SidewinderService} = require('@payburner/sidewinder-service');
const {TwitterService} = require('./TwitterService');
module.exports.process = async event => {

    let region = "us-west-1",
        secretName = "dev/sidewinder-twitter-processor";
    let client = new AWS.SecretsManager({
        region: region
    });
    const result = await new Promise((resolve, reject) => {
        client.getSecretValue({SecretId: secretName}, function (err, data) {

            if (err) {
                console.log(err);
                reject()
            } else {
                resolve(JSON.parse(data.SecretString))
            }
        });
    });

    const docClient = new AWS.DynamoDB.DocumentClient();
    const sidewinderService = new SidewinderService(result.xrpAddressSecret, docClient, client );
    await sidewinderService.init();
    const twitterService = new TwitterService(result, sidewinderService);
    twitterService.init();
    const t0 = new Date().getTime();
    try {
        const responses = [];
        console.info(
            "====>> START");
        await
            twitterService.onAccountApiPayload(event.body, responses);
        console.info(
            "<<==== STOP: Time to Decode and Process:" + (new Date().getTime()
            - t0));
        return {
            statusCode: 200, body: JSON.stringify(responses)
        };
    }
    catch( error ) {
        return {
            statusCode: 500, body: JSON.stringify(error)
        };
    }


};

