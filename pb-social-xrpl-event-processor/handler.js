'use strict';
const AWS = require('aws-sdk');
const {AccountUtils} = require(
    "@payburner/keyburner-sidewinder-model/dist/npm");
const {RewardsService} = require( "@payburner/sidewinder-service/RewardsService" );
const {BotCore} = require( "@payburner/sidewinder-service/BotCore" );
const {GlobalResponderClient} = require( "@payburner/sidewinder-service/GlobalResponderClient" );
const {UnderlyingTransactionStatus} = require(
    "@payburner/keyburner-sidewinder-model/dist/npm");

const getMappingOfXrpAddressAndDestinationTagToInternalAccount = function(docClient, xrp_address, destination_tag) {

    return new Promise((resolve, reject) => {
        const params = {
            TableName: "sidewinder_destination_tag_mapping",
            KeyConditionExpression: "xrp_address = :xrp_address and destination_tag = :destination_tag",
            IndexName: 'xrp_address-destination_tag-index',
            ScanIndexForward: true,
            ExpressionAttributeValues: {
                ":destination_tag": destination_tag.toString(),
                ":xrp_address": xrp_address
            }
        };
        docClient.query(params, function (err, data) {
            if (err) {
                resolve({status: 500, error: err});
            } else {

                if (data.Items.length > 0) {
                    resolve({status: 200, data: data.Items[0]})
                } else {
                    resolve({status: 404, error: 'Not Found.'});
                }
            }
        });
    });
}

const getUnderlyingTransactionByHash = function(docClient, underlying_txn_id) {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: "sidewinder_underlying_transactions",
            KeyConditionExpression: "underlying_txn_id = :underlying_txn_id",
            ScanIndexForward: true,
            ExpressionAttributeValues: {
                ":underlying_txn_id": underlying_txn_id
            }
        };
        docClient.query(params, function (err, data) {
            if (err) {
                resolve({status: 500, error: err});
            } else {

                if (data.Items.length > 0) {
                    resolve({status: 200, data: data.Items[0]})
                } else {
                    resolve({status: 404, error: 'Not Found.'});
                }
            }
        });
    })
}

const getSideWinderTokenByUnderlyingAccountId = function(docClient, underlying_account_id) {

    return new Promise((resolve, reject) => {

        const params = {
            TableName: "sidewinder_token",
            KeyConditionExpression: "underlying_account_id = :underlying_account_id",
            IndexName: 'underlying_account_id-index',
            ScanIndexForward: true,
            ExpressionAttributeValues: {
                ":underlying_account_id": underlying_account_id
            }
        };

        docClient.query(params, function (err, data) {
            if (err) {
                resolve({status: 500, error: err});
            } else {
                if (data.Items.length > 0) {
                    resolve({status: 200, data: data.Items[0]})
                } else {
                    resolve({status: 404, error: 'Not Found.'});
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
        const address = subscription.bot_xrp_address;


        // -- let us create a billing report.
        {
            const billingReport = {
                billingEventId: subscription.bot_xrp_address + '/' +
                    subscription.social_platform + '/' +
                    subscription.social_id + '/notification/' + data.hash,
                description: 'Received XRP payment on Payburner Social Wallet on '
                    + subscription.social_platform + ' with hash ' +
                    data.hash,
                billing_code: 'notification-of-xrpl-received',
                timestamp: new Date().toISOString(),
                bot_address: subscription.bot_xrp_address,
                subscriber_id: subscription.social_id,
                social_id: subscription.social_id,
                social_platform: subscription.social_platform,
                bot_platform: subscription.social_platform
            }
            console.log(
                'SavingBillingEvent:' + JSON.stringify(billingReport, null, 2));

            const registered = await registerBillingEvent(billingReport,
                docClient);
            if (!registered) {
                console.log(
                    'BillingEventAlreadyThere:' + JSON.stringify(billingReport,
                    null, 2));
                resolve(false);
                return;
            } else {
                console.log(
                    'BillingEventSaved :' + JSON.stringify(billingReport, null,
                    2) + ', Registered:' + registered);

            }
        }


        const botCore = new BotCore();

        // -- let us load the bot configuration
        let configResponse = await botCore.getConfig(address);
        if (configResponse.status !== 200) {
            console.log('Could not retrieve config:' + JSON.stringify(configResponse));
            return;
        }
        const config = configResponse.data;

        // -- create the rewards service
        const rewardsService = new RewardsService(config);
        await rewardsService.init();


        let onRampResult = null
        try {

            // -- let us onramp the funds...
            onRampResult = await rewardsService.onRamp(
                subscription.social_platform,
                subscription.social_id,
                AccountUtils.calculateRaw(data.amount.toString(), 6),
                data.destination, data.hash);



            console.log('OnRampResult : ' + JSON.stringify(onRampResult, null, 2));

            // -- let us notify the customer of the funds arrival.
            const globalResponderClient = new GlobalResponderClient( config );
            const msgRequest = { platform: subscription.social_platform,
                recipient: {id: subscription.social_id}, correlation_id: data.hash , message: 'You received '
                    + data.amount + ' XRP in your Payburner Social wallet.'}
            const response = await globalResponderClient.sendMessage( msgRequest );
            console.log('MsgResponse :' + JSON.stringify(response, null, 2));


        }
        catch(error) {
           console.log('OnRampFailed:' + JSON.stringify(error, null, 2));
        }

        resolve(true);
    })


}

const processDepositToIssuer = function(sidewinderToken, data, docClient) {

    return new Promise(async (resolve) => {

        const address = sidewinderToken.token_issuer_address;

        // -- let us create a billing report.
        {
            const billingReport = {
                billingEventId: address + '/notification/received-root-deposit/' + data.hash,
                description: 'Received Root XRP payment on Payburner Social Wallet on with hash ' +
                    data.hash,
                billing_code: 'notification-of-xrpl-received-root',
                timestamp: new Date().toISOString(),
                bot_address: address
            }
            console.log(
                'SavingRootBillingEvent:' + JSON.stringify(billingReport, null, 2));

            const registered = await registerBillingEvent(billingReport,
                docClient);
            if (!registered) {
                console.log(
                    'BillingEventAlreadyThere:' + JSON.stringify(billingReport,
                    null, 2));
                resolve(false);
                return;
            } else {
                console.log(
                    'BillingEventSaved :' + JSON.stringify(billingReport, null,
                    2) + ', Registered:' + registered);

            }
        }


        const botCore = new BotCore();

        // -- let us load the bot configuration
        let configResponse = await botCore.getConfig(address);
        if (configResponse.status !== 200) {
            console.log('Could not retrieve config:' + JSON.stringify(configResponse));
            return;
        }
        const config = configResponse.data;

        // -- create the rewards service
        const rewardsService = new RewardsService(config);
        await rewardsService.init();

        let onRampResult = null
        try {

            // -- let us onramp the funds...
            onRampResult = await rewardsService.onRampToOwner(
                AccountUtils.calculateRaw(data.amount.toString(), 6),
                data.destination, data.hash);
            console.log('On Ramp to OwnerResult: ' +
                JSON.stringify(onRampResult, null, 2));
        }
        catch(error) {
            console.log('OnRampFailed:' + JSON.stringify(error, null, 2));
        }

        resolve(true);
    })


}

const transitionWithdrawalToComplete = function(underlyingTransaction, data, docClient) {

    return new Promise(async (resolve) => {
        const address = underlyingTransaction.internal_address;

        // -- let us create a billing report.
        {
            const billingReport = {
                billingEventId: address + '/notification/settle-withdrawal/' + data.hash,
                description: 'Settled XRP withdrawal on Payburner Social Wallet on with hash ' +
                    data.hash,
                billing_code: 'notification-of-xrpl-withdrawal',
                timestamp: new Date().toISOString(),
                bot_address: address
            }
            console.log(
                'SavingWithdrawalBillingEvent:' + JSON.stringify(billingReport, null, 2));

            const registered = await registerBillingEvent(billingReport,
                docClient);
            if (!registered) {
                console.log(
                    'BillingEventAlreadyThere:' + JSON.stringify(billingReport,
                    null, 2));
                resolve(false);
                return;
            } else {
                console.log(
                    'BillingEventSaved :' + JSON.stringify(billingReport, null,
                    2) + ', Registered:' + registered);

            }
        }
        const botCore = new BotCore();

        // -- let us load the bot configuration
        let configResponse = await botCore.getConfig(underlyingTransaction.token_issuer_address);
        if (configResponse.status !== 200) {
            console.log('Could not retrieve config:' + JSON.stringify(configResponse));
            return;
        }
        const config = configResponse.data;

        // -- create the rewards service
        const rewardsService = new RewardsService(config);
        await rewardsService.init();

        let onRampResult = null
        try {
            // -- let us on ramp the funds...
            onRampResult = await rewardsService.completeOffRampResultByIssuer(data.hash);
            console.log('On Ramp to OwnerResult: ' +
                JSON.stringify(onRampResult, null, 2)   );
            // -- let us notify the customer of the funds arrival.
            const globalResponderClient = new GlobalResponderClient( config );
            console.log('Getting PlatformUser');
            const platformUser = await rewardsService.getSocialUserByInternalAddress(underlyingTransaction.internal_address);
            console.log('Got PlatformUser:' + JSON.stringify(platformUser, null, 2));;
            if (platformUser.status === 200) {
                const response = await globalResponderClient.sendMessage(
                    {platform: platformUser.data.socialplatform,
                        correlation_id: data.hash,
                        recipient: {id: platformUser.data.socialid}, message: "Your withdrawal of " +
                            AccountUtils.calculateUnit(underlyingTransaction.underlying_amount.toString(), 6) + ' XRP has settled.  The transaction hash is ' + data.hash} );
                console.log('SendNotificationResponse : ' + JSON.stringify(response, null, 2));
            }

            resolve(true)
        }
        catch(error) {
            console.log('OffRampFailed:' + error);
            console.log('OffRampFailed:' + JSON.stringify(error, null, 2));
            resolve(false);
        }

    });

}

module.exports.process = async event => {

    const docClient = new AWS.DynamoDB.DocumentClient();

    for (let idx = 0; idx < event.Records.length; idx++) {

        const record = event.Records[idx];
        const data = JSON.parse(record.Sns.Message);

        // -- if we have a destination tag, attempt to find a mapping to an internal account.
        if (typeof data.destinationTag !== 'undefined') {
            const destinationAddressTag = data.destination + data.destinationTag;
            console.log('-- destination address:' + data.destination + ', Tag:' + data.destinationTag + ', hash:' + data.hash);
            const destinationTagMappingResponse =
                await getMappingOfXrpAddressAndDestinationTagToInternalAccount(docClient, data.destination, data.destinationTag);
            if (destinationTagMappingResponse.status === 200) {
                console.log('-- destination tag mapping found.  destinationAddressAndTag: '
                    + destinationAddressTag + ', mappingResponse: '
                    + JSON.stringify(destinationTagMappingResponse));

                const msg = data.destination + '?dt=' + data.destinationTag
                    + ' received ' + data.amount + ' XRP from ' + data.source
                    + ' with transaction ' + data.hash;
                const destinationTagMapping = destinationTagMappingResponse.data;
                await doProcessing(destinationTagMapping, data, msg, docClient);
                return;
            }
        }

        // -- if we arrive here, it means that either there was no destination tag,
        // -- or that there was no mapping.  in this case we will find the `root`
        // -- account and update it.
        const sidewinderTokenResponse = await getSideWinderTokenByUnderlyingAccountId(docClient, data.destination);
        if (sidewinderTokenResponse.status === 200) {
            console.log('SidewinderTokenResponse:' + JSON.stringify(sidewinderTokenResponse, null, 2));
            await processDepositToIssuer(sidewinderTokenResponse.data, data, docClient);
            return;
        }

        // -- if the transaction is not a deposit, perhaps it is a withdrawal.
        // -- the first step is to check and see if there is a pending withdrawal.
        const pendingWithdrawal = await getUnderlyingTransactionByHash(docClient, data.hash);
        if (pendingWithdrawal.status === 200) {
            console.log('INFO :: We found a transaction for a settlement.: ' + data.hash);
            if (pendingWithdrawal.data.status === UnderlyingTransactionStatus.PENDING) {
                const transitionedWithdrawalToComplete =
                    await transitionWithdrawalToComplete(pendingWithdrawal.data, data, docClient);
                console.log('INFO :: We settled.: ' + data.hash
                    + ', transitionedToCompleted: ' + transitionedWithdrawalToComplete );
                return;
            }
            else {
                console.log('WARNING :: We received a settlement for an already settled payment: ' + data.hash);
            }
        }
    }
};

