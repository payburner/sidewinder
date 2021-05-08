const {RemoteWalletClient} = require(
    "@payburner/sidewinder-service/RemoteWalletClient");

const AWS = require('aws-sdk');
const {Aqfr} = require( "@aqfr/aqfr.js" );
const uuid4 = require('uuid4');

class BotBusinessLogicXRPLAlerts {

    constructor(config, egress) {
        this.config = config;
        this.botName = config.botName;
        this.egress = egress;
        this.docClient = new AWS.DynamoDB.DocumentClient();
        this.aqfr = new Aqfr();
        this.remoteWalletClient = new RemoteWalletClient(config);
    }

    isSubscribed( addressTag, platformUser ) {
        const self = this;
        return new Promise((resolve, reject) => {
            const params = {
                TableName: "pb_alerts_xrpl_mainnet_subscriptions",
                IndexName: 'addressTag-platformUser-index',
                KeyConditionExpression: "addressTag = :addressTag and platformUser = :platformUser",
                ExpressionAttributeValues: {
                    ":addressTag": addressTag,
                    ":platformUser": platformUser
                }
            };
            //const t0 = new Date().getTime();
            self.docClient.query(params, function (err, data) {
              console.log('Query Time Get Sequence: ' + JSON.stringify(params, null, 2));
                if (err) {
                    console.error("Unable to query. Error:",
                        JSON.stringify(err, null, 2));
                    resolve(false)
                } else {
                    console.log('Query DATA: ' + JSON.stringify(data, null, 2));
                    if (data.Items.length === 0) {
                        resolve(false)
                    }
                    else {
                        resolve(true);
                    }
                }
            });
        })
    }

    isSubscribedAccounts( address, platformUser ) {
        const self = this;
        return new Promise((resolve, reject) => {
            const params = {
                TableName: "pb_alerts_xrpl_mainnet_accounts",
                IndexName: 'address-platformUser-index',
                KeyConditionExpression: "address = :address and platformUser = :platformUser",
                ExpressionAttributeValues: {
                    ":address": address,
                    ":platformUser": platformUser
                }
            };
            //const t0 = new Date().getTime();
            self.docClient.query(params, function (err, data) {
                console.log('Query Time Get Sequence: ' + JSON.stringify(params, null, 2));
                if (err) {
                    console.error("Unable to query. Error:",
                        JSON.stringify(err, null, 2));
                    resolve(false)
                } else {
                    console.log('Query DATA: ' + JSON.stringify(data, null, 2));
                    if (data.Items.length === 0) {
                        resolve(false)
                    }
                    else {
                        resolve(true);
                    }
                }
            });
        })
    }

    getSubscription( addressTag, platformUser ) {
        const self = this;
        return new Promise((resolve, reject) => {
            const params = {
                TableName: "pb_alerts_xrpl_mainnet_subscriptions",
                IndexName: 'addressTag-platformUser-index',
                KeyConditionExpression: "addressTag = :addressTag and platformUser = :platformUser",
                ExpressionAttributeValues: {
                    ":addressTag": addressTag,
                    ":platformUser": platformUser
                }
            };
            //const t0 = new Date().getTime();
            self.docClient.query(params, function (err, data) {
                console.log('Query Time Get Sequence: ' + JSON.stringify(params, null, 2));
                if (err) {
                    console.error("Unable to query. Error:",
                        JSON.stringify(err, null, 2));
                    resolve({status: 404, error: 'Not found'})
                } else {
                    console.log('Query DATA: ' + JSON.stringify(data, null, 2));
                    if (data.Items.length === 0) {
                        resolve({status: 404, error: 'Not found'})
                    }
                    else {
                        resolve({status: 200, data: data.Items[0]})
                    }
                }
            });
        })
    }

    isNumeric(str) {
        if (typeof str != "string") return false // we only process strings!
        return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
            !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
    }

    handleDirectMessage(event) {
        const comp = this;
        return new Promise(async (resolve) => {

            if (event.payload.msg_text
                === '/help') {
                resolve('Hi, @' + event.users.originator.screen_name + '.  Welcome to @' + comp.botName
                    + '.  Commands include: /help, /subscribe payments xrpAddress [destinationTag], /subscribe balances xrpAddress above|below amount, /unsubscribe payments xrpAddress [destinationTag], /unsubscribe balances xrpAddress');
            }
            else if (event.payload.msg_text
                === '/test') {
                resolve('Hi, @' + event.users.originator.screen_name + '.  Welcome to @' + comp.botName
                    + '.  Commands include: /help, /subscribe payments xrpAddress [destinationTag], /subscribe balances xrpAddress above|below amount, /unsubscribe payments xrpAddress [destinationTag], /unsubscribe balances xrpAddress');
            }
            else if (event.payload.msg_text.startsWith('/unsubscribe payments')) {
                // -- parse and validate the request
                const requestTokens = event.payload.msg_text.split(' ');
                console.log('Request Tokens: ' + JSON.stringify(requestTokens));
                if (requestTokens.length !== 4 && requestTokens.length !== 3){
                    resolve( '@' + event.users.originator.screen_name + ', to unsubscribe please send a request with either "/unsubscribe payments address" OR "/subscribe payments address tag"');
                    return;
                }
                if (!comp.aqfr.isValidXrpAddress(requestTokens[2])) {
                    resolve( '@' + event.users.originator.screen_name + ', the address portion of your request is not a valid XRP address.  Please try again.');
                    return;
                }
                if (requestTokens.length == 4 && !comp.isNumeric(requestTokens[3])) {
                    resolve( '@' + event.users.originator.screen_name + ', the destination tag portion of your request is not a number.  Please try again.');
                    return;
                }

                // -- check if already subscribed
                const addressTag = requestTokens[2] + (requestTokens.length === 4 ? '/' + requestTokens[3]:'');
                const platformUser = event.platform + '/' + event.users.originator.id;
                const subscription = await comp.getSubscription(addressTag, platformUser);

                if (subscription.status !== 200) {
                    resolve( 'Hi there, ' +
                        '@' + event.users.originator.screen_name + ', you are not subscribed to that address and optional tag');
                }
                else {
                    const deleteItem = {
                        Delete: {
                            TableName: 'pb_alerts_xrpl_mainnet_subscriptions',
                            Key: {
                                subscriptionId: subscription.data.subscriptionId
                            },
                        }
                    };
                    const wrote = await comp.transactionalWrite(deleteItem);

                    if (wrote) {
                        resolve( 'Hi there, ' +
                            '@' + event.users.originator.screen_name + ', we have unsubscribed you');
                    }
                    else {
                        resolve( 'Apologies, ' +
                            '@' + event.users.originator.screen_name + ', but we encountered a technical problem unsubscribing you.');
                    }
                }
            }
            else if (event.payload.msg_text.startsWith('/unsubscribe balances')) {
                // -- parse and validate the request
                const requestTokens = event.payload.msg_text.split(' ');
                console.log('Request Tokens: ' + JSON.stringify(requestTokens));
                if (requestTokens.length !== 3){
                    resolve( '@' + event.users.originator.screen_name + ', to unsubscribe please send a request with either "/unsubscribe balances address"');
                    return;
                }
                if (!comp.aqfr.isValidXrpAddress(requestTokens[2])) {
                    resolve( '@' + event.users.originator.screen_name + ', the address portion of your request is not a valid XRP address.  Please try again.');
                    return;
                }

                const platformUser = event.platform + '/' + event.users.originator.id;
                const subscription = await comp.isSubscribedAccounts(requestTokens[2], platformUser);

                if (subscription.status !== 200) {
                    resolve( 'Hi there, ' +
                        '@' + event.users.originator.screen_name + ', you are not subscribed to balance alerts on that address');
                }
                else {
                    const deleteItem = {
                        Delete: {
                            TableName: 'pb_alerts_xrpl_mainnet_accounts',
                            Key: {
                                subscriptionId: subscription.data.subscriptionId
                            },
                        }
                    };
                    const wrote = await comp.transactionalWrite(deleteItem);

                    if (wrote) {
                        resolve( 'Hi there, ' +
                            '@' + event.users.originator.screen_name + ', we have unsubscribed you');
                    }
                    else {
                        resolve( 'Apologies, ' +
                            '@' + event.users.originator.screen_name + ', but we encountered a technical problem unsubscribing you.');
                    }
                }
            }
            else if (event.payload.msg_text.startsWith('/subscribe payments')) {

                // -- parse and validate the request
                const requestTokens = event.payload.msg_text.split(' ');
                if (requestTokens.length !== 4 && requestTokens.length !== 3){
                    resolve( '@' + event.users.originator.screen_name + ', to subscribe please send a request with either "/subscribe payments address" OR "/subscribe payments address tag"');
                    return;
                }
                if (!comp.aqfr.isValidXrpAddress(requestTokens[2])) {
                    resolve( '@' + event.users.originator.screen_name + ', the address portion of your request is not a valid XRP address.  Please try again.');
                    return;
                }
                if (requestTokens.length == 4 && !comp.isNumeric(requestTokens[3])) {
                    resolve( '@' + event.users.originator.screen_name + ', the destination tag portion of your request is not a number.  Please try again.');
                    return;
                }

                // -- check if already subscribed

                const addressTag = requestTokens[2] + (requestTokens.length === 4 ? '/' + requestTokens[3]:'');
                const platformUser = event.platform + '/' + event.users.originator.id;
                const isSubscribed = await comp.isSubscribed(addressTag, platformUser);

                // -- if not create the subscription
                if (!isSubscribed) {

                    const data = {
                        subscriptionId: uuid4(),
                        addressTag: addressTag,
                        platformUser: platformUser,
                        address: requestTokens[2],
                        tag: (requestTokens.length === 4 ? requestTokens[3]:''),
                        subscriber_platform: event.platform,
                        subscriber_screen_name: event.users.originator.screen_name,
                        subscriber_id: event.users.originator.id,
                        subscriber_bot_name: comp.botName,
                        subscriber_bot_address: comp.config.address,
                        count_triggers: 0
                    }

                    const update = {
                        Put: {
                            TableName: 'pb_alerts_xrpl_mainnet_subscriptions',
                            Item: data
                        }
                    };

                    const wrote = await comp.transactionalWrite(update);
                    if (wrote) {
                        resolve( 'Hi there, ' +
                            '@' + event.users.originator.screen_name + ', we have created your subscription.');
                    }
                    else {
                        resolve( 'Apologies, ' +
                            '@' + event.users.originator.screen_name + ', but we encountered a technical problem writing your subscription.');
                    }
                }
                else {
                    resolve( 'Hi there, ' +
                        '@' + event.users.originator.screen_name + ', you are already subscribed.');
                }
            }

            else if (event.payload.msg_text.startsWith('/subscribe balances')) {

                // -- parse and validate the request
                const requestTokens = event.payload.msg_text.split(' ');
                if (requestTokens.length !== 5){
                    resolve( '@' + event.users.originator.screen_name + ', to get a balance alert please send a request with either "/subscribe balances address below amount" OR "/subscribe balances address above amount"');
                    return;
                }
                if (!comp.aqfr.isValidXrpAddress(requestTokens[2])) {
                    resolve( '@' + event.users.originator.screen_name + ', the address portion of your request is not a valid XRP address.  Please try again.');
                    return;
                }
                if (!comp.isNumeric(requestTokens[4])) {
                    resolve( '@' + event.users.originator.screen_name + ', the amount portion of your request is not a number.  Please try again.');
                    return;
                }
                if (requestTokens[3] !== 'above' && requestTokens[3] !== 'below') {
                    resolve( '@' + event.users.originator.screen_name + ', the third argument must be either "above" or "below".  You submitted: "' + requestTokens[2] + '"');
                    return;
                }

                // -- check if already subscribed


                const platformUser = event.platform + '/' + event.users.originator.id;
                const isSubscribed = await comp.isSubscribedAccounts(requestTokens[2], platformUser);

                // -- if not create the subscription
                if (!isSubscribed) {

                    const data = {
                        subscriptionId: uuid4(),
                        platformUser: platformUser,
                        address: requestTokens[2],
                        subscriber_platform: event.platform,
                        subscriber_screen_name: event.users.originator.screen_name,
                        subscriber_id: event.users.originator.id,
                        subscriber_bot_name: comp.botName,
                        subscriber_bot_address: comp.config.address,
                        above_or_below: requestTokens[3],
                        amount: requestTokens[4],
                        last_trigger_amount: -1,
                        last_trigger_timestamp: 'never',
                        count_triggers: 0
                    }

                    const update = {
                        Put: {
                            TableName: 'pb_alerts_xrpl_mainnet_accounts',
                            Item: data
                        }
                    };

                    const wrote = await comp.transactionalWrite(update);
                    if (wrote) {
                        resolve( 'Hi there, ' +
                            '@' + event.users.originator.screen_name + ', we have created your subscription.');
                    }
                    else {
                        resolve( 'Apologies, ' +
                            '@' + event.users.originator.screen_name + ', but we encountered a technical problem writing your subscription.');
                    }
                }
                else {
                    resolve( 'Hi there, ' +
                        '@' + event.users.originator.screen_name + ', you are already subscribed.');
                }
            }

            else {
                resolve('I beg your pardon, @' + event.users.originator.screen_name
                    + '. I did not understand that.  Commands include: /help, /subscribe payments xrpAddress [destinationTag], /subscribe balance xrpAddress above|below amount, /unsubscribe payments xrpAddress [destinationTag], /unsubscribe balances xrpAddress');
            }
        });
    }

    transactionalWrite( update ) {
        const self = this;
        return new Promise( async (resolve, reject) => {

            console.log('Items:' + JSON.stringify([update], null, 2));

            console.log('Sending Write Request to DB');
            self.docClient.transactWrite({ TransactItems: [update] }, function (err, data) {
                if (err) {
                    console.log('AWS Transactional Write Error:' + err);
                    console.log('AWS Transactional Write Error:' + JSON.stringify(err, null, 2));
                    resolve(false)
                } else {
                    resolve(true);
                }
            });
        });
    }

    async handleFollowEvent( event ) {
        console.log('Follow Event:' + JSON.stringify(event, null, 2));
         // send XRP
        await this.egress.sendMessage( { platform: event.platform, recipient: event.users.originator, correlation_id: event.event_id,
            message: "Hey, @" + event.users.originator.screen_name
                + "! Thanks for following me. :-)  I can alert you on Payments sent to and received by any XRP address. " +
                + "To get alerted, DM me back with /subscribe payments anyXrpAddress optionalDestinationTag -- " +
                "I will monitor the XRPL and notify you here when that address sends or receives a payment.\n\n  " +
                "Stay tuned, more cool features to come.  We're just getting started. "});

        const remoteWalletResponse = await this.remoteWalletClient.transferUnitAmount(event.platform,
            event.users.originator, 0.001);

        if (remoteWalletResponse.status === 200) {

            await this.egress.sendMessage( { platform: event.platform, recipient: event.users.originator, correlation_id: event.event_id,
                message: " To thank you for following me, I have just sent you 0.001 XRP to your @PayburnerSocial wallet.  " +
                    " Go there and DM to find out more."});
        }
        else {
            console.log('ALERT REWARDS FAILURE:' + JSON.stringify(remoteWalletResponse, null, 2));

            /*
            await this.egress.sendMessage( { platform: event.platform, recipient: event.users.originator, correlation_id: event.event_id,
                message: " To thank you for following me, I wanted to reward you with you with 0.001 XRP to @PayburnerSocial, but unfortunately the transaction did not complete.  " +
                    " Go there and DM to find out more."});*/
        }
    }

    async handleFavoriteEvent( event ) {
        console.log('Favorite Event:' + JSON.stringify(event, null, 2));
        await this.egress.sendMessage( { recipient: event.users.originator, correlation_id: event.event_id,
            message: "Hey, @" + event.users.originator.screen_name + "! Thanks for liking my post. <3" });
        // send XRP Reward.
        const remoteWalletResponse = await this.remoteWalletClient.transferUnitAmount(event.platform,
            event.users.originator, 0.001);
        console.log('Wallet Response:' + JSON.stringify(remoteWalletResponse, null, 2));

        if (remoteWalletResponse.status === 200) {
            await this.egress.sendMessage( { platform: event.platform, recipient: event.users.originator, correlation_id: event.event_id,
                message: " To thank you for liking one of our tweets, we have just sent you 0.001 XRP to @PayburnerSocial.  " +
                    " Go there and DM to find out more."});
        }
        else {
            console.log('ALERT REWARDS FAILURE:' + JSON.stringify(remoteWalletResponse, null, 2));

            /*
            await this.egress.sendMessage( { platform: event.platform, recipient: event.users.originator, correlation_id: event.event_id,
                message: " To thank you for liking one of our tweets, we wanted to reward you with you with 0.001 XRP to @PayburnerSocial, but unfortunately the transaction did not complete.  " +
                    " Go there and DM to find out more."});*/
        }
    }

    async handleMicroBlogEvent( event ) {
        console.log('MicroBlogEvent Event:' + JSON.stringify(event, null, 2));

    }

}

module.exports.BotBusinessLogicXRPLAlerts = BotBusinessLogicXRPLAlerts;