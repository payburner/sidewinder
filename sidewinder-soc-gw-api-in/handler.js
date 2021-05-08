'use strict';
const {GlobalResponderClient}  = require( "@payburner/sidewinder-service/GlobalResponderClient");
const {BotCore}  = require( "@payburner/sidewinder-service/BotCore");

const {PlatformService} = require( "@payburner/sidewinder-service/PlatformService");
const uuid4 = require('uuid4');
const AWS = require('aws-sdk');
const {GatewayInHandler} = require(
    "@payburner/sidewinder-service/GatewayInHandler");
module.exports.process = async event => {

    console.log('Event:' + JSON.stringify(event, null, 2));


        try {

            const address = event.pathParameters.address;

            let region = "us-west-1",
                secretName = "dev/sidewinder-twitter-processor-" + address;

            let secretClient = new AWS.SecretsManager({
                region: region
            });

            // get the config...
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

            // check idempotency
            const idempotency = event.headers['I-Sidewinder-Idempotency-Token'];
            const emitter = new GlobalResponderClient(config);
            const gateway = new GatewayInHandler(config, emitter);
            if (typeof idempotency !== 'undefined' && !gateway.ensureIdempotency(idempotency)) {
                console.log('Received redundant message:' + idempotency);
                return {
                    statusCode: 200,
                    body: JSON.stringify(
                        {status:200, message:
                                'This call has been made previously and is being ignored in the interest of idempotency.'})
                }
            }

            // check authorization
            const accessToken = event.headers['Authorization'];
            if (typeof accessToken === 'undefined') {
                return {
                    statusCode: 401,
                    body: JSON.stringify(
                        {status:401, error:'Please supply an access token in the Authorization header.'})
                }
            }

            // -- decode and verify
            const botCore = new BotCore();
            const decodedRequest = botCore.decodeAndVerify( event );
            console.log('Decoded Request:' + JSON.stringify(decodedRequest, null, 2));
            if (decodedRequest.status !== 200) {
                return {
                    statusCode: decodedRequest.status, body: JSON.stringify(decodedRequest)
                };
            }
            console.log('address:' + decodedRequest.data.address);

            const body = decodedRequest.data.payload;

            const platformService = new PlatformService(new AWS.DynamoDB.DocumentClient(), new AWS.SecretsManager({
                region: "us-west-1"
            }));

            console.log('Checking Access token');
            const accessTokenResponse = await platformService.checkAccessToken(accessToken);
            console.log(' Access token response:' + JSON.stringify(accessTokenResponse, null, 2));
            if (accessTokenResponse.status !== 200) {
                return {
                    statusCode: 401,
                    body: JSON.stringify(
                        {status:401, error:accessTokenResponse.error})
                }
            }

            const tokenAddress = accessTokenResponse.data.token_address;
            const expectedTokenAddress = decodedRequest.data.address;
            if (tokenAddress !== expectedTokenAddress) {
                return {
                    statusCode: 401,
                    body: JSON.stringify(
                        {status:401, error:'The address associated with the access token does not manage the signature.'})
                }
            }

            const botIdFieldResponse = emitter.getBotIdField(accessTokenResponse.data.socialplatform);
            if (botIdFieldResponse.status !== 200) {
                return {
                    statusCode: botIdFieldResponse.status,
                    body: JSON.stringify(botIdFieldResponse)
                }
            }

            if (typeof config[botIdFieldResponse.data] === 'undefined' || config[botIdFieldResponse.data] === null) {
                return {
                    statusCode:500,
                    body: JSON.stringify({error:'We could not identify the bot id:' + botIdFieldResponse.data})
                }
            }

            console.log('Body:' + JSON.stringify(body, null, 2));
            let to = config[botIdFieldResponse.data];
            let toName = config.botName;
            let isToBot = true;

            const output = {
                event_type: 'direct-message',
                action: 'create',
                event_id: typeof idempotency !== 'undefined' ? idempotency : uuid4(),
                platform: accessTokenResponse.data.socialplatform,
                timestamp: new Date().getTime(),
                bot_name: config.botName,
                bot_address: config.address,
                users: {
                    originator: {
                        id: accessTokenResponse.data.socialid,
                        screen_name: accessTokenResponse.data.socialname,
                        country: 'unknown',
                        is_bot: false
                    },
                    target: {
                        id: to,
                        screen_name: toName,
                        country: 'unknown',
                        is_bot: isToBot
                    }
                },
                payload: body
            };
            console.log('Normalized Events:' + JSON.stringify(output, null, 2));

            return gateway.handleNormalizedEvents([output], accessTokenResponse.data.socialplatform, botIdFieldResponse.data);

        } catch (e) {
            console.error(e);
            return {
                statusCode: 500,
                body: JSON.stringify(
                    {error: 'Error validating webhook signature'})
            }
        }

};

