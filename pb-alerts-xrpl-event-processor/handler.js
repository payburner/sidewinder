'use strict';
const AWS = require('aws-sdk');

const {BotCore} = require( "@payburner/sidewinder-service/BotCore" );
const {TwitterResponderClient} = require( "@payburner/sidewinder-service/TwitterResponderClient" );
const getSubscriptions = function( docClient, addressTag ) {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: "pb_alerts_xrpl_mainnet_subscriptions",
            IndexName: 'addressTag-index',
            KeyConditionExpression: "addressTag = :addressTag",
            ExpressionAttributeValues: {
                ":addressTag": addressTag
            }
        };
        //const t0 = new Date().getTime();
        docClient.query(params, function (err, data) {
            console.log('Query Time Get Sequence: ' + JSON.stringify(params, null, 2));
            if (err) {
                console.error("Unable to query. Error:",
                    JSON.stringify(err, null, 2));
                resolve({ status: 500, error: err})
            } else {
                console.log('Query DATA: ' + JSON.stringify(data, null, 2));
                if (data.Items.length === 0) {
                    resolve({ status:200, data: []})
                }
                else {
                    resolve({ status:200, data: data.Items});
                }
            }
        });
    });
}

const getBalanceSubscriptions = function( docClient, address, above_or_below ) {

    return new Promise((resolve, reject) => {
        const params = {
            TableName: "pb_alerts_xrpl_mainnet_accounts",
            IndexName: 'address-above_or_below-index',
            KeyConditionExpression: "address = :address, above_or_below = :above_or_below",
            ExpressionAttributeValues: {
                ":address": address,
                ":above_or_below": above_or_below
            }
        };
        //const t0 = new Date().getTime();
        docClient.query(params, function (err, data) {
            console.log('Query Time Get Sequence: ' + JSON.stringify(params, null, 2));
            if (err) {
                console.error("Unable to query. Error:",
                    JSON.stringify(err, null, 2));
                resolve({ status: 500, error: err})
            } else {
                console.log('Query DATA: ' + JSON.stringify(data, null, 2));
                if (data.Items.length === 0) {
                    resolve({ status:200, data: []})
                }
                else {
                    resolve({ status:200, data: data.Items});
                }
            }
        });
    })
}

const transactionalWrite = function( updates, docClient ) {

    return new Promise( async (resolve, reject) => {

        console.log('Items:' + JSON.stringify(updates, null, 2));

        console.log('Sending Write Request to DB');
        docClient.transactWrite({ TransactItems: updates }, function (err, data) {
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

const registerBillingEvent = function( usageReport, docClient ) {
    const update = {
        Put: {
            TableName: 'sidewinder_billing_events',
                Item: usageReport,
                ConditionExpression: "attribute_not_exists(billingEventId)"
        }
    }
    return transactionalWrite([update], docClient);
}

const doProcessing = function(subscription, data, msg, docClient) {

    return new Promise(async (resolve) => {
        const address = subscription.subscriber_bot_address;
        {
            const billingReport = {
                billingEventId: subscription.subscriber_bot_name + '/' +
                    subscription.subscriber_platform + '/' +
                    subscription.subscriber_screen_name + '/notification/'
                    + data.hash,
                description: 'Receive notification on '
                    + subscription.subscriber_platform + ' of XRPL Transaction '
                    +
                    data.hash,
                billing_code: 'notification-of-xrpl-transaction',
                timestamp: new Date().toISOString(),
                bot_name: subscription.subscriber_bot_name,
                bot_address: subscription.subscriber_bot_address,
                subscriber_screen_name: subscription.subscriber_screen_name,
                subscriber_id: subscription.subscriber_id,
                bot_platform: subscription.subscriber_platform,
                subscription_id: subscription.subscriptionId
            }
            const registered = await registerBillingEvent(billingReport,
                docClient);

            if (!registered) {
                console.log('BillingEventAlreadyProcessed : ' + JSON.stringify(
                    billingReport, null, 2));
                resolve(false);
                return;
            } else {
                console.log(
                    'BillingEventProcessed :' + JSON.stringify(billingReport,
                    null, 2) + ', Registered:' + registered);
            }
        }

        const botCore = new BotCore();

        let configResponse = await botCore.getConfig(address);
        if (configResponse.status !== 200) {
            console.log('Could not retrieve config:' + JSON.stringify(configResponse));
            return;
        }

        console.log('GotSecretConfig');
        const twitterResponderClient = new TwitterResponderClient(configResponse.data);

        const response = await twitterResponderClient.sendMessage(
            {platform: subscription.subscriber_platform,
                correlation_id: data.hash,
                recipient: {id: subscription.subscriber_id}, message: msg} );
        console.log('MsgResponse :' + JSON.stringify(response, null, 2));

        resolve(true);
    });
}

const doProcessingAccounts = function(subscription, data, msg, docClient) {

    return new Promise(async (resolve) => {
        const address = subscription.subscriber_bot_address;

        // -- now we need to check to see if the balance

        {
            const billingReport = {
                billingEventId: subscription.subscriber_bot_name + '/' +
                    subscription.subscriber_platform + '/' +
                    subscription.subscriber_screen_name + '/notification-balance/'
                    + data.hash,
                description: 'Receive notification on '
                    + subscription.subscriber_platform + ' of XRPL Balance change '
                    +
                    data.hash,
                billing_code: 'notification-of-xrpl-balance-bounds',
                timestamp: new Date().toISOString(),
                bot_name: subscription.subscriber_bot_name,
                bot_address: subscription.subscriber_bot_address,
                subscriber_screen_name: subscription.subscriber_screen_name,
                subscriber_id: subscription.subscriber_id,
                bot_platform: subscription.subscriber_platform,
                subscription_id: subscription.subscriptionId
            }
            const registered = await registerBillingEvent(billingReport,
                docClient);

            if (!registered) {
                console.log('BillingEventAlreadyProcessed : ' + JSON.stringify(
                    billingReport, null, 2));
                resolve(false);
                return;
            } else {
                console.log(
                    'BillingEventProcessed :' + JSON.stringify(billingReport,
                    null, 2) + ', Registered:' + registered);
            }
        }

        const botCore = new BotCore();

        let configResponse = await botCore.getConfig(address);
        if (configResponse.status !== 200) {
            console.log('Could not retrieve config:' + JSON.stringify(configResponse));
            return;
        }

        console.log('GotSecretConfig');
        const twitterResponderClient = new TwitterResponderClient(configResponse.data);

        const response = await twitterResponderClient.sendMessage(
            {platform: subscription.subscriber_platform,
                correlation_id: data.hash,
                recipient: {id: subscription.subscriber_id}, message: msg} );
        console.log('MsgResponse :' + JSON.stringify(response, null, 2));

        resolve(true);
    });
}

module.exports.process = async event => {
    const docClient = new AWS.DynamoDB.DocumentClient();
    for (let idx = 0; idx < event.Records.length; idx++) {
        const record = event.Records[idx];
        const data = JSON.parse(record.Sns.Message);
        const sourceAddressTag = data.source;
        const sourceSubscriptions = await getSubscriptions(docClient, sourceAddressTag);
        console.log('Source Subscriptions:' + sourceAddressTag + ' = ' + JSON.stringify(sourceSubscriptions));
        if (sourceSubscriptions.data.length > 0) {
            for (let idx = 0; idx < sourceSubscriptions.data.length; idx++) {
                const subscription = sourceSubscriptions.data[idx];
                const msg = data.source + ' sent ' + data.amount + ' XRP to ' + data.destination + (typeof data.destinationTag !== 'undefined' ? '?dt=' +
                    data.destinationTag : '') + ' with transaction ' + data.hash;
                await doProcessing(subscription, data, msg, docClient);
            }
        }

        if (typeof data.destinationTag !== 'undefined') {
            const destinationAddressTag = data.destination + data.destinationTag;
            const destinationSubscriptions = await getSubscriptions(docClient, destinationAddressTag);
            console.log('Destination Tag Subscriptions:' + destinationAddressTag + ' = ' + JSON.stringify(destinationSubscriptions));
            const msg = data.destination + '?dt=' + data.destinationTag + ' received ' + data.amount + ' XRP from ' + data.source + ' with transaction ' + data.hash;
            for (let idx = 0; idx < destinationSubscriptions.data.length; idx++) {
                const subscription = destinationSubscriptions.data[idx];
                await doProcessing(subscription, data, msg, docClient);
            }
        }

        const destinationAddressTag = data.destination;
        const destinationSubscriptions = await getSubscriptions(docClient, destinationAddressTag);
        console.log('Destination Subscriptions:' + destinationAddressTag + ' = ' + JSON.stringify(destinationSubscriptions));
        const msg = data.destination + (typeof data.destinationTag !== 'undefined' ? '?dt=' +
            data.destinationTag : '')+ ' received ' + data.amount + ' XRP from ' + data.source + ' with transaction ' + data.hash;

        for (let idx = 0; idx < destinationSubscriptions.data.length; idx++) {
            const subscription = destinationSubscriptions.data[idx];
            await doProcessing(subscription, data, msg, docClient);
        }

        // -- now do account balance subscriptions -- and we check for 'below', since the source balance would decrease.
        const sourceBalanceSubscriptions = await getBalanceSubscriptions(docClient, sourceAddressTag, 'below');
        for (let idx = 0; idx < sourceBalanceSubscriptions.data.length; idx++) {
            const subscription = sourceBalanceSubscriptions.data[idx];
            await doProcessingAccounts(subscription, data, msg, docClient);
        }

        // -- now do account balance subscriptions -- and we check for 'below', since the source balance would decrease.
        const destinationBalanceSubscriptions = await getBalanceSubscriptions(docClient, data.destination, 'above');
        for (let idx = 0; idx < destinationBalanceSubscriptions.data.length; idx++) {
            const subscription = destinationBalanceSubscriptions.data[idx];
            await doProcessingAccounts(subscription, data, msg, docClient);
        }

    }


};

