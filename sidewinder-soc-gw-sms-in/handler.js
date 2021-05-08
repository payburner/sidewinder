'use strict';
const {GlobalResponderClient}  = require( "@payburner/sidewinder-service/GlobalResponderClient");

const {PlatformService} = require( "@payburner/sidewinder-service/PlatformService");
const uuid4 = require('uuid4');
const AWS = require('aws-sdk');
const addrs = require("email-addresses")
const qs = require('qs');
const crypto = require('crypto');
const twilio = require('twilio');
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

            const signature = event.headers['X-Twilio-Signature'];
            const idempotency = event.headers['I-Twilio-Idempotency-Token'];
            const emitter = new GlobalResponderClient(config);
            const gateway = new GatewayInHandler(config, emitter);
            if (!gateway.ensureIdempotency(idempotency)) {
                console.log('Received redundant message:' + idempotency);
                return {
                    statusCode: 200,
                    body: JSON.stringify(
                        {})
                }
            }
            const url = 'https://' + event.headers.Host + '/dev' + event.path;
            console.log('Url:' + url);
            const authToken = config.twilio_auth_token;
            const body = qs.parse(event.body);
            const validated = twilio.validateRequest(authToken, signature, url, body);
            console.log('ValidatedSignature:' + validated);

            if (!validated) {
                return {
                    statusCode: 401,
                    body: JSON.stringify(
                        {error: 'Error validating webhook signature'})
                }
            }

            console.log('Body:' + JSON.stringify(body, null, 2));
            let to = body.To;
            let toName = body.botName;
            let isToBot = true;
            let toCountry = body.ToCountry;
            if (typeof body.OtherRecipients0 !== 'undefined') {
                to = body.OtherRecipients0;
                toName = body.OtherRecipients0;
                isToBot = false;
                toCountry = 'UNKNOWN';
            }

            const output = {
                event_type: 'direct-message',
                action: 'create',
                event_id: body.SmsMessageSid,
                platform: 'phone',
                timestamp: new Date().getTime(),
                bot_name: config.botName,
                bot_address: config.address,
                users: {
                    originator: {
                        id: body.From,
                        screen_name: body.From,
                        country: body.FromCountry,
                        is_bot: false
                    },
                    target: {
                        id: to,
                        screen_name: toName,
                        country: toCountry,
                        is_bot: isToBot
                    }
                },
                payload: {
                    msg_text: body.Body
                }
            };
            console.log('Normalized Events:' + JSON.stringify(output, null, 2));

            return gateway.handleNormalizedEvents([output], 'phone', 'twilio_phone_number');

        } catch (e) {
            console.error(e);
            return {
                statusCode: 500,
                body: JSON.stringify(
                    {error: 'Error validating webhook signature'})
            }
        }

};

