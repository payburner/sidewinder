'use strict';
const {GlobalResponderClient} = require( "@payburner/sidewinder-service/GlobalResponderClient");
const {PlatformService} = require( "@payburner/sidewinder-service/PlatformService");
const uuid4 = require('uuid4');
const AWS = require('aws-sdk');
const addrs = require("email-addresses")
const qs = require('qs');
const crypto = require('crypto');
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

            const body = qs.parse(event.body);

            const signingKey = config.mailgun_signing_key;
            const timestamp = body.timestamp;
            const token = body.token;


                const encodedToken = crypto
                .createHmac('sha256', signingKey)
                .update(timestamp.concat(token))
                .digest('hex')
            if ((encodedToken !== body.signature)) {
                return {
                    statusCode: 403,
                    body: JSON.stringify(
                        {error: 'Error validating webhook signature'})
                }
            }

            console.log('Body:' + JSON.stringify(body, null, 2));

            let text = body['stripped-text'].trim();

            const tokens = text.split(/\r?\n/);
            if (tokens.length > 1) {
                console.log('We have received a multi-line input.  splitting it and taking first line:' + text + '=>' + tokens[0]);
                text = tokens[0];
            }

            const emitter = new GlobalResponderClient(config);
            const gateway = new GatewayInHandler(config, emitter);


            let addresses = addrs(body.To);
            addresses = addresses.addresses.map((address) => address.address).filter((address)=>address !== config.mailgun_email_address);
            console.log('Addresses:' + JSON.stringify(addresses, null, 2    ))

            const output = {
                event_type: 'direct-message',
                action: 'create',
                event_id: body.signature,
                platform: 'email',
                timestamp: new Date().getTime(),
                bot_name: config.botName,
                bot_address: config.address,
                users: {
                    originator: {
                        id: body.sender,
                        screen_name: body.sender,
                        is_bot: false
                    },
                    target: {
                        id: addresses.length > 0 ? addresses[0] : config.mailgun_email_address,
                        screen_name: addresses.length > 0 ? addresses[0] : config.botName,
                        is_bot: addresses.length > 0 ? false : true,
                    }
                },
                payload: {
                    msg_text: text
                }
            };


            return gateway.handleNormalizedEvents([output], 'email', 'mailgun_email_address');

        } catch (e) {
            console.error(e);
            return {
                statusCode: 500,
                body: JSON.stringify(
                    {error: 'Error validating webhook signature'})
            }
        }

};

