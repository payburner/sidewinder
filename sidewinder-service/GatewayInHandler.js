const AWS = require('aws-sdk');
const crypto = require('crypto');
const axios = require('axios');
const uuid4 = require('uuid4');
const {KeyBurner} = require("@payburner/keyburner-core/dist/npm");
const {PlatformService} = require("./PlatformService");
const {RewardsService} = require("./RewardsService");
class GatewayInHandler {

    constructor( config, emitter ) {
        this.config = config;
        this.emitter = emitter;
        this.secretClient = new AWS.SecretsManager({
            region: 'us-west-1'
        });
        this.docClient = new AWS.DynamoDB.DocumentClient();
        this.platformService = new PlatformService(
            this.docClient, this.secretClient);
    }

    ensureIdempotency = function (id) {
        const self = this;
        return new Promise((resolve) => {
            const dynamodbParams = {
                TableName: 'sidewinder_message_idempotency',
                Item: {
                    id: id
                },
                ConditionExpression: 'attribute_not_exists(id)'
            };
            self.docClient.put(dynamodbParams, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                    resolve(false);
                } else {
                    console.log(data);
                    resolve(true);
                }
            });
        })
    }

    async isBotUserOptedOut(platform, senderId) {
        return await this.platformService.isBotUserOptedOut(platform, {id:senderId}, this.config.address);
    }

    // returning null means that we can continue.  Returning a response means that response should be returned to the client
    async handleFilter(platform, senderId, text) {
        let isOptedOut = await this.isBotUserOptedOut(platform,  senderId, this.config.address);

        console.log('Is Opted Out: ' + isOptedOut + ', IdHash:' + this.platformService.botUserHash(platform, {id:senderId}, this.config.address) + ' ' + senderId );
        if (text.startsWith('/subscribe') && isOptedOut) {
            const optInResult = await this.platformService.optInBotUser(this.platformService.botUserHash(platform, {id:senderId}, this.config.address));
            console.log('Opted back in:' + JSON.stringify(optInResult) + ' ' + optInResult);
            const response = await this.emitter.sendMessage(
                {
                    platform: platform,
                    correlation_id: uuid4(),
                    recipient: {id: senderId},
                    message: 'Welcome back! You can now interact with us via ' + platform
                });
            console.log('OptBack Message:' + JSON.stringify(response, null, 2));
            return {
                statusCode: 200,
                body: JSON.stringify({})
            }
        }
        else if (text.startsWith('/subscribe')) {

            const response = await this.emitter.sendMessage(
                {
                    platform: platform,
                    correlation_id: uuid4(),
                    recipient: {id: senderId},
                    message: 'You are already subscribed to ' + platform + ' messages.  Please respond with /help to find out how you can interact with me.'
                });
            console.log('OptBack ' + platform + ':' + JSON.stringify(response, null, 2));
            return {
                statusCode: 200,
                body: JSON.stringify({})
            }
        }
        if (text.startsWith('/unsubscribe') && !isOptedOut) {
            const optOutResult = await this.platformService.optOutBotUser(this.platformService.botUserHash(platform, {id:senderId}, this.config.address));

            const response = await this.emitter.sendMessage(
                {
                    platform: platform,
                    correlation_id: uuid4(),
                    force: true,
                    recipient: {id: senderId},
                    message: 'You are unsubscribed from to ' + platform + ' messages from ' + this.config.botName +  '. We respect your wishes and will no longer send any messages to you.  If you do wish to receive ' + platform + ' messages from us again, simply send /subscribe'
                });
            console.log('Opt Out Message:' + JSON.stringify(response, null, 2));
            console.log('Opted back out:' + JSON.stringify(optOutResult) + ' ' + optOutResult);

            return {
                statusCode: 200,
                body: JSON.stringify({})
            }
        }
        else if (text.startsWith('/unsubscribe')) {
            const response = await this.emitter.sendMessage(
                {
                    platform: platform,
                    correlation_id: uuid4(),
                    force: true,
                    recipient: {id: senderId},
                    message: 'You are already unsubscribed from ' +platform + ' messages from ' + this.config.botName +  '. We respect your wishes and will no longer send any messages to you.  If you do wish to receive ' + platform + ' messages from us again, simply send /subscribe'
                });
            console.log('Opt Out Message:' + JSON.stringify(response, null, 2));
            const optOutResult = await this.platformService.optOutBotUser(this.platformService.botUserHash(platform, {id:senderId}, this.config.address));
            console.log('Opted back out:' + JSON.stringify(optOutResult) + ' ' + optOutResult);

            return {
                statusCode: 200,
                body: JSON.stringify({})
            }
        }
        if (isOptedOut) {
            console.log('The user is opted out so we are not processing. ' + senderId);

            const response = await this.emitter.sendMessage(
                {
                    platform: platform,
                    force: true,
                    correlation_id: uuid4(),
                    recipient: {id: senderId},
                    message: 'You are currently opted out of this service.  If you would like to opt in to the service, please send /subscribe.'
                });

            console.log('Send you are currently unsubscribed: ' + senderId + ', Response:' + JSON.stringify(response, null, 2));

            return {
                statusCode: 200,
                body: JSON.stringify({})
            }
        }

        else if (text.startsWith('/token')) {

            const token = await this.platformService.createAccessToken(platform, {id:senderId}, this.config.address);
            const response = await this.emitter.sendMessage(
                {
                    platform: platform,
                    correlation_id: uuid4(),
                    force: true,
                    recipient: {id: senderId},
                    message: 'Your access token on ' +platform + ' for ' + this.config.botName +  ' is "' + token.data.id + '" and you signing seed is "' +token.data.seed+'"'
                });
            console.log('Access Token:' + JSON.stringify(response, null, 2));

            return {
                statusCode: 200,
                body: JSON.stringify({})
            }
        }

        return null;
    }

    async handleNormalizedEvents( normalizedEvents, platform, idFieldName ) {
        try {


            console.log('--> Normalized Events:' + JSON.stringify(
                normalizedEvents, null, 2));

            if (normalizedEvents.length == 0) {
                return {
                    statusCode: 200, body: 'OK'
                };
            }

            if (normalizedEvents[0].event_type === 'direct-message') {
                console.log('Handling filter:' + JSON.stringify(normalizedEvents[0], null, 2));
                const filterResponse = await this.handleFilter(normalizedEvents[0].platform,
                    normalizedEvents[0].users.originator.id, normalizedEvents[0].payload.msg_text);
                if (filterResponse !== null) {
                    console.log('Filter Response:' + JSON.stringify(filterResponse, null, 2));
                    return filterResponse;
                }
            }
            else {
                const isBotUserOptedOut = await this.isBotUserOptedOut(normalizedEvents[0].platform,
                    normalizedEvents[0].users.originator.id);
                if (isBotUserOptedOut) {
                    console.log('The user is opted out so we are not processing. ' + normalizedEvents[0].users.originator.id);
                    return {
                        statusCode: 200, body: 'OPTED OUT'
                    };
                }
            }

            const rewardsService = new RewardsService(this.config);


            // -- if the target is the bot
            if (typeof normalizedEvents[0].users.target.id
                !== 'undefined' && normalizedEvents[0].users.target.id === this.config[idFieldName]) {

                const address = this.config.address;

                // --------------------------------------------------------------------------------
                // -- if the target user (which is the bot) doesnt have a setup on the platform,
                // -- we have to create one.
                // --------------------------------------------------------------------------------
                const getResponse = await this.platformService.getInternalAddressBySocialIdAndPlatform(
                    platform, normalizedEvents[0].users.target.id);
                console.log('GetResponse:' + JSON.stringify(getResponse, null, 2));
                if (getResponse.status !== 200
                    || getResponse.data.internal_address !== this.config.address) {
                    const wrote = await this.platformService.writeToDbIfNecessary(
                        platform, normalizedEvents[0].users.target.id,
                        address);
                    console.log('Wrote Address Mapping: ' + wrote +
                         ', platform: ' + platform
                        + ', address: ' + address);
                    const tag = await rewardsService.getDestinationTag(
                        address, platform,
                        normalizedEvents[0].users.target.id, 'rhY2avHExFhK7nKJe2FcoVXLTMmeKCBCZc');
                    console.log('Wrote Destination Tag: ' + tag+
                        ', platform: ' + platform
                        + ', address: ' + address);

                    try {
                        const platformAccount = await this.platformService.secretService.getPlatFormAccount(
                            platform,
                            normalizedEvents[0].users.target.id);
                        if (platformAccount.seed
                            !== this.config.xrpAddressSecret
                            || platformAccount.address !== address) {
                            try {
                                const putPlatform = await this.platformService.secretService.updatePlatformAccount(
                                    platform,
                                    normalizedEvents[0].users.target.id,
                                    address, this.config.xrpAddressSecret);
                                console.log(
                                    'Put Platform: ' + JSON.stringify(
                                    putPlatform, null, 2));
                            } catch (error) {
                                console.log(
                                    'Error updating platform:' + error);
                                console.log('Error updating platform:'
                                    + JSON.stringify(error, null, 2));
                            }
                        }
                    } catch (error) {
                        try {
                            const putPlatform = await this.platformService.secretService.putPlatformAccount(
                                platform,
                                normalizedEvents[0].users.target.id,
                                address, this.config.xrpAddressSecret);
                            console.log(
                                'Put Platform: ' + JSON.stringify(
                                putPlatform, null, 2));
                        } catch (error) {
                            console.log(
                                'Error updating platform:' + error);
                            console.log('Error updating platform:'
                                + JSON.stringify(error, null, 2));
                        }
                    }
                }
            }

            // --------------------------------------------------------------------------------
            // -- let us make sure that the user ids and screen names are registered...
            // --------------------------------------------------------------------------------

            // -- go through the users in the events so that each user is only
            // -- checked once.
            const usersMap = {};
            normalizedEvents.forEach((event) => {
                if (typeof usersMap[event.users.originator.id] === 'undefined') {
                    usersMap[event.users.originator.id] = event.users.originator;
                }
                if (typeof usersMap[event.users.target.id] === 'undefined') {
                    usersMap[event.users.target.id] = event.users.target;
                }
            });

            const keys = Object.keys(usersMap);
            for (let idx = 0; idx < keys.length; idx++) {
                const user = usersMap[keys[idx]];
                const firstBot = this.config.address;
                const registeredPlatformUser = await this.platformService.registerPlatformUserIfNecessary(platform, user, firstBot);
                console.log('Registered Platform User Mapping:' + registeredPlatformUser);
                const registeredBotUser = await this.platformService.registerBotUserIfNecessary(platform, user, firstBot);
                console.log('Registered Bot User Mapping:' + registeredBotUser);
                // -- set the registration status on the users before we send them to the business logic...
                normalizedEvents.forEach((event) => {
                    if (event.users.originator.id === user.id) {
                        event.users.originator.is_new_bot_user = registeredBotUser;
                        event.users.originator.is_new_platform_user = registeredPlatformUser;
                    }
                    else if (event.users.target.id === user.id) {
                        event.users.target.is_new_bot_user = registeredBotUser;
                        event.users.target.is_new_platform_user = registeredPlatformUser;
                    }
                });
            }

            console.log('AfterUsersUpdate:' + JSON.stringify(normalizedEvents));
            // --------------------------------------------------------------------------------
            // -- sign the events and send to the business logic lambda.
            // --------------------------------------------------------------------------------
            const client = new KeyBurner();
            const keypair = client.deriveKeyPair(
                this.config.xrpAddressSecret);
            const signed = client.signTransaction(
                {events: normalizedEvents}, keypair);

            try {
                const response = await axios.post(
                    this.config.botBusinessLambda,
                    signed, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                console.log('--> GW IN -- BUSINESS LOGIC RESPONSE : '
                    + JSON.stringify(response.data, null, 2));

                if (response.data.status === 200) {
                    console.log('--> GW IN -- Status : '
                        + response.data.status);
                    if (response.data.data.slash_response_status) {
                        console.log('--> GW IN -- Response Status : '
                            + response.data.data.slash_response_status);

                            const request = {
                                platform: platform,
                                recipient:
                                response.data.data.slash_respond_to,
                                correlation_id: uuid4(),
                                message:
                                response.data.data.slash_response
                            };
                            console.log('--> GW IN -- OUT REQUEST:'
                                + JSON.stringify(request, null, 2));
                            const sendMessageResponse = await this.emitter.sendMessage(
                                request);
                            console.log('<-- GW IN -- GW OUT RESPONSE:'
                                + JSON.stringify(sendMessageResponse,
                                    null, 2));

                    }
                }
            } catch (error) {
                return {
                    statusCode: error.response.data.status,
                    body: JSON.stringify(error.response.data)
                };
            }

            return {
                statusCode: 200, body: 'OK'
            };
        } catch (error) {
            console.log('Error:' + error);
            console.log('Error:' + JSON.stringify(error));

            return {
                statusCode: 500, body: JSON.stringify(error)
            };
        }
    }

}

module.exports.GatewayInHandler = GatewayInHandler;