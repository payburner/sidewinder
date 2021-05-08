'use strict';
const crypto = require('crypto');
const axios = require('axios');
const uuid4 = require('uuid4');
const {MetricsService} = require(
    "@payburner/sidewinder-service/MetricsService");
const {TwitterHandler} = require('./TwitterHandler');
const {validateSignature, validateWebhook} = require('twitter-autohook');
const {KeyBurner} = require("@payburner/keyburner-core/dist/npm");
const {GlobalResponderClient} = require(
    '@payburner/sidewinder-service/GlobalResponderClient');
const {PlatformService} = require(
    "@payburner/sidewinder-service/PlatformService");
const {RewardsService} = require(
    "@payburner/sidewinder-service/RewardsService");
const {GatewayInHandler} = require(
    "@payburner/sidewinder-service/GatewayInHandler");
const AWS = require('aws-sdk');

module.exports.process = async event => {

    console.log('Event:' + JSON.stringify(event, null, 2));

    if (event.httpMethod === 'GET') {

        try {

            const address = event.pathParameters.address;

            let region = "us-west-1",
                secretName = "dev/sidewinder-twitter-processor-" + address;

            let client = new AWS.SecretsManager({
                region: region
            });
            const config = await new Promise((resolve, reject) => {
                client.getSecretValue({SecretId: secretName},
                    function (err, data) {

                        if (err) {
                            console.log(err);
                            reject()
                        } else {
                            resolve(JSON.parse(data.SecretString))
                        }
                    });
            });

            const hookConfig = {
                token: config.accessToken,
                token_secret: config.accessTokenSecret,
                consumer_key: config.apiKey,
                consumer_secret: config.apiSecretKey,
                env: config.env
            };

            if (typeof event.queryStringParameters.crc_token !== 'undefined') {
                try {
                    const query = 'crc_token='
                        + event.queryStringParameters.crc_token + '&nonce='
                        + event.queryStringParameters.nonce;
                    console.log('Query:' + query);

                    const signature = 'sha256=' + crypto
                    .createHmac('sha256', hookConfig.consumer_secret)
                    .update(query)
                    .digest('base64');
                    console.log('Signature:' + signature);
                    console.log('WebSignature:'
                        + event.headers['X-Twitter-Webhooks-Signature']);
                    console.log('Equal:' + crypto.timingSafeEqual(
                        Buffer.from(
                            event.headers['X-Twitter-Webhooks-Signature']),
                        Buffer.from(signature)));

                    if (!validateSignature({
                            'x-twitter-webhooks-signature': event.headers['X-Twitter-Webhooks-Signature']
                        }, hookConfig,
                        query)) {
                        console.error('Cannot validate webhook signature');
                        return;
                    } else {
                        console.log('signature validated');
                    }
                } catch (e) {
                    console.error(e);
                }
                console.log('validating webhook');

                const crc = validateWebhook(
                    event.queryStringParameters.crc_token, hookConfig);
                return {
                    statusCode: 200, body: JSON.stringify(crc)
                };

            } else {
                return {
                    statusCode: 400, body: JSON.stringify({})
                };
            }
        } catch (error) {
            console.log('ERROR:' + error);
            console.log('ERROR:' + JSON.stringify(error, null, 2));
            return {
                statusCode: 500,
                body: JSON.stringify(
                    {status: 500, error: 'Error running the crc'})
            };
        }
    } else if (event.httpMethod === 'POST') {
        try {
            const address = event.pathParameters.address;

            let region = "us-west-1",
                secretName = "dev/sidewinder-twitter-processor-" + address;

            let secretClient = new AWS.SecretsManager({
                region: region
            });
            const config = await new Promise((resolve, reject) => {
                secretClient.getSecretValue({SecretId: secretName},
                    function (err, data) {

                        if (err) {
                            console.log(err);
                            reject()
                        } else {
                            resolve(JSON.parse(data.SecretString))
                        }
                    });
            });

            const hookConfig = {
                id: config.twitterId,
                token: config.accessToken,
                token_secret: config.accessTokenSecret,
                consumer_key: config.apiKey,
                consumer_secret: config.apiSecretKey,
                env: config.env
            };
            if (!validateSignature({
                'x-twitter-webhooks-signature': event.headers['X-Twitter-Webhooks-Signature']
            }, hookConfig, event.body)) {
                console.error('Cannot validate webhook signature');
                return {
                    statusCode: 400,
                    body: JSON.stringify(
                        {error: 'Cannot validate webhook signature'})
                };
            } else {

                const twitterResponder = new GlobalResponderClient(config);
                const twitterHandler = new TwitterHandler(config);

                try {


                    const gateway = new GatewayInHandler(config, twitterResponder);

                    const normalizedEvents = twitterHandler.onAccountApiPayload(
                        JSON.parse(event.body));

                    console.log('--> Normalized Events:' + JSON.stringify(
                        normalizedEvents, null, 2));

                    return gateway.handleNormalizedEvents(normalizedEvents, 'twitter', 'twitterId');

                } catch (error) {
                    console.log('Error:' + error);
                    console.log('Error:' + JSON.stringify(error));

                    return {
                        statusCode: 500, body: JSON.stringify(error)
                    };
                }
            }
        } catch (e) {
            console.error(e);
            return {
                statusCode: 500,
                body: JSON.stringify(
                    {error: 'Error validating webhook signature'})
            }
        }
    }

    return {
        statusCode: 500, body: JSON.stringify({error: 'Should not get here'})
    };
};

