const Twit = require('twit');
const uuid4 = require('uuid4');
const {AccountUtils} = require(
    "@payburner/keyburner-sidewinder-model/dist/npm");

class TwitterService {

    constructor(config, sidewinderService) {

        this.config = config;
        this.T = null;
        this.sidewinderService = sidewinderService;
        this.botName = config.botName;

    }

    init() {

        this.T = new Twit({
            consumer_key: this.config.apiKey,
            consumer_secret: this.config.apiSecretKey,
            access_token: this.config.accessToken,
            access_token_secret: this.config.accessTokenSecret,
            timeout_ms: 60 * 1000,  // optional HTTP request timeout to apply to all requests.
            strictSSL: true,     // optional - requires SSL certificates to be valid.
        });
    }

    getUser(payload, userId) {
        if (typeof payload.users !== 'undefined') {
            if (typeof payload.users[userId] !== null && payload.users[userId]
                !== null) {
                return payload.users[userId];
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    tweet(status) {
        return new Promise((resolve) => {
            const callback = function (response) {
                console.log(
                    'Tweet sent response:' + JSON.stringify(response, null, 2));
                resolve({
                    status: 200, message: response
                });
            };
            this.T.post('statuses/update', {status: status}, callback);
        });
    }

    sendMessage(recipientId, message) {
        const comp = this;
        console.log('>>>> !!!!! == ' + recipientId);
        return new Promise((resolve, reject) => {
            const sendMessage =
                {
                    "event": {
                        "type": "message_create",
                        "message_create": {
                            "target": {"recipient_id": recipientId},
                            "message_data": {"text": message}
                        }
                    }
                };

            const callback = function (response) {
                console.log(
                    'CALLBACK DM ==> : ');
                console.log('<<<< !!!!!');
                if (typeof response !== 'undefined' && typeof response.message
                    !== 'undefined') {
                    resolve({status: 400, error: response.message});
                    return;
                } else {
                    resolve({
                        status: 200
                    });
                }
            };
            console.log('----- !!!!!');
            comp.T.post('direct_messages/events/new', sendMessage, callback);
        });
    }


    handleMessage(payload, messageEvent) {
        const comp = this;
        const returnVal = [];
        return new Promise(async (resolve) => {
            if (messageEvent.type === 'message_create') {
                returnVal.push('message create: '
                    + messageEvent.message_create.message_data.text + ' from ' +
                    messageEvent.message_create.sender_id + ' typeof '
                    + (typeof messageEvent.message_create.sender_id));

                const senderId = messageEvent.message_create.sender_id;
                const senderUser = comp.getUser(payload, senderId);

                if (senderUser !== null) {

                    const senderScreenName = senderUser.screen_name;
                    console.log('SCREEN NAME:' + senderScreenName + ', BOT NAME:'
                        + comp.botName);


                    // -- let us test to see if the source name is the name of the bot
                    if (senderScreenName === comp.botName) {
                        console.log('Ignoring dm by the bot');
                        returnVal.push('Ignoring dm by the bot');
                    } else {

                        console.log('! user:' + senderId + ' '
                            + messageEvent.message_create.message_data.text
                            + ' ' + senderUser.screen_name);

                        const senderAccount = await comp.sidewinderService.getAccount('twitter',
                           senderScreenName );
                        if (senderAccount.isNew) {
                            const tweetResponse = await comp.tweet(
                                'Welcome @'
                                + senderScreenName
                                + '. Your initial tipping balance is '
                                + AccountUtils.calculateUnit(
                                senderAccount.account.data.available_balance.toFixed(),
                                6));
                            console.log(
                                'Initial balance tweet response: '
                                + JSON.stringify(tweetResponse, null,
                                2));
                            returnVal.push('Initial balance tweet response');
                        }

                        if (messageEvent.message_create.message_data.text
                            === '/balance') {
                            returnVal.push('sending balance');
                            const sendMessageResponse = await comp.sendMessage(
                                senderId,
                                'Your @' + comp.botName + ' tipping balance is: '
                                + AccountUtils.calculateUnit(
                                senderAccount.account.data.available_balance.toFixed(),
                                6) + ' ' + comp.sidewinderService.tokenDefinition.data.token_symbol);
                            returnVal.push('sent balance');
                            console.log(
                                'BALANCE DM Sent:' + JSON.stringify(
                                sendMessageResponse));

                        }
                        else if (messageEvent.message_create.message_data.text
                            === '/rewards') {
                            const senderRewardsAccount = await comp.sidewinderService.rewardsService.getAccount('twitter',
                                senderScreenName );
                            returnVal.push('sending rewards');

                            const sendMessageResponse = await comp.sendMessage(
                                senderId,
                                'Your @' + comp.botName + ' rewards balance is: '
                                + AccountUtils.calculateUnit(
                                senderRewardsAccount.account.data.available_balance.toFixed(),
                                6) + ' ' + comp.sidewinderService.rewardsService.tokenDefinition.data.token_symbol);
                            returnVal.push('sent rewards balance');
                            console.log(
                                'REWARDS BALANCE DM Sent:' + JSON.stringify(
                                sendMessageResponse) + ' ' + JSON.stringify(comp.sidewinderService.rewardsService.tokenDefinition, null, 2));
                        }
                        else if (messageEvent.message_create.message_data.text.startsWith('/redeem')) {

                            const tokens = messageEvent.message_create.message_data.text.split('\ ');
                            if (tokens.length !== 3 && tokens.length !== 4) {
                                await comp.sendMessage(
                                    senderId,
                                    'To redeem your XRP rewards, please submit the following command:\n\n /redeem AMOUNT A_VALID_XRP_ADDRESS OPTIONAL_DESTINATION_TAG \n\nFor example \n\n/redeem 1 rMwXJutPuyiNXXMuJCrLGfXVLzfhMFZXWA\n\n  If you wish to redeem your rewards to an exchange hosted account, please include the optional destination tag.  For example: \n\n/redeem 1 rMwXJutPuyiNXXMuJCrLGfXVLzfhMFZXWA 23423423423\n\n Please note that in all cases we can not be responsible for you specifying an incorrect address or destination tag.\n\nThe minimum XRP withdrawal amount is 0.0001 XRP and the maximum is 10 XRP.' );
                            }
                            else {

                                const response = await comp.sidewinderService.rewardsService.redeem('twitter',
                                    senderScreenName, tokens[1], tokens[2], tokens.length === 4 ? tokens[3] : null );
                                await comp.sendMessage(senderId, response);
                                returnVal.push('sent rewards redeem');

                            }

                        }

                        else if (messageEvent.message_create.message_data.text
                            === '/help') {
                            returnVal.push('sending help');

                            const isUnderlying = typeof comp.sidewinderService.tokenDefinition.data.underlying_currency !== 'undefined';

                            if (isUnderlying) {
                                await comp.sendMessage(
                                    senderId,
                                    'Welcome to @' + comp.botName + '.  Commands include: /help, /info, /fund, /stats, /site, /balance, /address, /rewards, /redeem')
                                returnVal.push('sent help');
                            }
                            else {
                                const sendHelpMessage = await comp.sendMessage(
                                    senderId,
                                    'Welcome to @' + comp.botName + '.  Commands include: /help, /info, /stats, /site, /balance, /address, /rewards, /redeem')
                                returnVal.push('sent help');
                            }

                        } else if (messageEvent.message_create.message_data.text
                            === '/info') {
                            returnVal.push('sending info');
                            const sendMessageResult = await comp.sendMessage(
                                senderId,
                                'Information. The fee for tipping is '
                                +
                                AccountUtils.calculateUnit(
                                    comp.sidewinderService.tokenDefinition.data.transaction_fee.toFixed(
                                        0), 6) + '.')
                            returnVal.push('sent info');
                            console.log(
                                'INFO DM Sent:' + JSON.stringify(
                                sendMessageResult));
                        }
                        else if (messageEvent.message_create.message_data.text
                            === '/stats') {
                            returnVal.push('sending stats');
                            const metrics = await comp.sidewinderService.getUserMetrics( senderAccount.api);

                            let metricsString = 'Stats:\n';
                            metrics.forEach((metric) => {
                                if (metric.metric.endsWith('_amount_counter')) {
                                    metricsString += ' ' + metric.display + ': ' + AccountUtils.calculateUnit(
                                        metric.value.toFixed(),
                                        6) + '\n';
                                }
                                else {
                                    metricsString += ' ' + metric.display + ': ' + metric.value+ '\n';
                                }


                            })

                            const sendMessageResult = await comp.sendMessage(
                                senderId,
                                 metricsString);
                            returnVal.push('sent metrics');
                            console.log(
                                'METRICS DM Sent:' + JSON.stringify(
                                sendMessageResult));
                        }
                        else if (messageEvent.message_create.message_data.text
                            === '/site') {

                            const message = 'Please visit our site to learn more at https://www.tipsandthanks.com';

                            const sendMessageResult = await comp.sendMessage(
                                senderId,
                                message);
                            returnVal.push('sent site');

                        }
                        else if (messageEvent.message_create.message_data.text
                            === '/address') {

                            const message = 'Your @tipsandthanks address is: ' + senderAccount.api.getAddress() + '.  This address is unique to your personal Twitter account and represents you.  For now this is only informational -- fyi.  In the future you will be able to do interesting things with this address.';

                            await comp.sendMessage(
                                senderId,
                                message);
                            returnVal.push('sent address');

                        }
                        else if (messageEvent.message_create.message_data.text
                            === '/fund') {
                            returnVal.push('sending fund');
                            const isUnderlying = typeof comp.sidewinderService.tokenDefinition.data.underlying_currency !== 'undefined';

                            if (!isUnderlying) {

                                try {

                                //const purchaseResult = await comp.sidewinderService.createFunding(
                                //    'twitter', senderId, 1);

                                const sendMessageResult = await comp.sendMessage(
                                    senderId, 'To fund your PlusOneBot account with XRP, please visit the Payburner Gateway by clicking here: ' +
                                    'https://gateway.payburner.com/gateway/index.html?paybuttonId=' + comp.config.fundingButtonId + '&refId=' + uuid4() + '&postResultUrl=https://8m30qjtvmc.execute-api.us-west-1.amazonaws.com/dev/process');
                                }
                                catch(error) {
                                    const sendMessageResult1 = await comp.sendMessage(
                                        senderId, JSON.stringify(error, null, 2));
                                    const sendMessageResult2 = await comp.sendMessage(
                                        senderId, (error));
                                }
                            }
                            else {
                                const sendMessageResult = await comp.sendMessage(
                                    senderId,
                                    'Funding. Apologies, but we cannot fulfill your request.  This token is not backed by an underlying currency');
                            }

                            returnVal.push('sent funding');
                            console.log(
                                'FUNDING DM Sent:' + JSON.stringify(
                                sendMessageResult));
                        }
                        else {
                            returnVal.push('sending generic');
                            const isUnderlying = typeof comp.sidewinderService.tokenDefinition.data.underlying_currency !== 'undefined';

                            if (isUnderlying) {
                               await comp.sendMessage(
                                    senderId,
                                    'Welcome to @' + comp.botName + '.  Commands include: /help, /info, /fund, /stats, /site, /balance, /address, /rewards, /redeem')
                            }
                            else {
                                await comp.sendMessage(
                                    senderId,
                                    'Welcome to @' + comp.botName + '.  Commands include: /help, /info, /stats, /site, /balance, /address, /rewards, /redeem')
                            }
                            returnVal.push('sent generic');
                            console.log(
                                'GENERIC DM Sent:' + JSON.stringify(
                                sendMessageResult));
                        }

                    }
                }

            }
            resolve(returnVal);
        });
    }

    handleFavoriteEvent(favoriteEvent) {
        const comp = this;
        const returnVal = [];
        return new Promise(async (resolve) => {

            console.log('Favorite Event:' + JSON.stringify(favoriteEvent, null, 2));
            // -- they have favorited one of our posts.

            const likerScreenName = favoriteEvent.user.screen_name;
            if (likerScreenName !== comp.botName) {
                const likerAccount = await comp.sidewinderService.getAccount('twitter',
                    likerScreenName);
                if (likerAccount.isNew) {
                    const tweetResponse = await comp.tweet(
                        'Welcome @'
                        + likerScreenName
                        + '. Your initial tipping balance is '
                        + AccountUtils.calculateUnit(
                        likerAccount.account.data.available_balance.toFixed(),
                        6));
                    console.log(
                        'New account created for the liker: '
                        + JSON.stringify(
                        tweetResponse, null, 2));
                    returnVal.push('initial balance tweet response');
                }
                else {

                    const likerRewards = await comp.sidewinderService.rewardsService.getAccount('twitter',
                        likerScreenName);
                    await comp.sidewinderService.rewardsService.reward('twitter', likerScreenName, 0.001);
                    console.log('Rewarded the favorite');
                }
            }
            else {
                console.log('The liker was the bot:' + favoriteEvent.user.screen_name);
            }

            resolve(returnVal);
        });
    }
    handleFollowEvent(followEvent) {
        const comp = this;
        const returnVal = [];
        return new Promise(async (resolve) => {
            if (followEvent.type === 'follow'
                && followEvent.target.screen_name
                === comp.botName) {
                const sourceScreenName = followEvent.source.screen_name;
                console.log('SCREEN NAME:' + sourceScreenName);
                const isFollowing = await comp.sidewinderService.isFollowing(
                    'twitter',
                    sourceScreenName)
                if (!isFollowing) {
                    const accountResponse = await comp.sidewinderService.getAccount('twitter',
                        sourceScreenName)
                    if (accountResponse.isNew) {
                        const tweetResponse = await comp.tweet(
                            'Welcome @'
                            + sourceScreenName
                            + '. Your initial tipping balance is '
                            + AccountUtils.calculateUnit(
                            accountResponse.account.data.available_balance.toFixed(),
                            6))
                        console.log(
                            'Initial balance tweet response: '
                            + JSON.stringify(
                            tweetResponse, null, 2));
                        returnVal.push('initial balance tweet response');

                    }

                    await comp.sidewinderService.rewardsService.getAccount('twitter',
                        sourceScreenName);
                    await comp.sidewinderService.rewardsService.reward('twitter', sourceScreenName, 0.01);

                    const followMarked = await comp.sidewinderService.dataService.markFollow(
                        'twitter', sourceScreenName);
                    console.log('MARKED FOLLOWED:' + followMarked);
                    console.log(
                        'MARKED FOLLOWED:' + JSON.stringify(followMarked, null,
                        2));
                    const sendMessageResponse = await comp.sendMessage(
                        followEvent.source.id,
                        'Thank you for following me!  Your initial balance is: '
                        + AccountUtils.calculateUnit(
                        accountResponse.account.data.available_balance.toFixed(),
                        6));
                    returnVal.push('thank you for following me');

                    console.log('DM Sent:'
                        + JSON.stringify(
                            sendMessageResponse));

                } else {
                    console.log('re-follow by '
                        + sourceScreenName
                        + '. Ignoring.');
                }
            }
            resolve(returnVal);
        });
    }

    handleTweetEvent(tweetCreateEvent) {
        const comp = this;
        return new Promise(async (resolve) => {
            const returnVal = [];
            if (typeof tweetCreateEvent.in_reply_to_screen_name
                !== 'undefined') {

                const sourceScreenName = tweetCreateEvent.user.screen_name;
                console.log('SCREEN NAME:' + sourceScreenName + ' ' + comp.botName);
                if (sourceScreenName === comp.botName) {
                    console.log('Ignoring tweet by the bot:'
                        + tweetCreateEvent.text + ' ' + sourceScreenName);
                    return;
                }
                const sourceId = tweetCreateEvent.user.id;
                const text = tweetCreateEvent.text; // @toocool2betrue @PayburnerBot +1
                if (typeof text !== 'undefined' && text !== null) {
                    const accountResponse = await comp.sidewinderService.getAccount('twitter',
                        sourceScreenName)
                    const regex = /(.+)(\+)([\d]+$|[\d]+\.[\d]+$|\.[\d]+$)/;
                    const matches = text.match(regex);
                    console.log(
                        'matches:' + JSON.stringify(matches, null,
                        2));
                    if (matches !== null) {
                        const amount = matches[matches.length - 1];
                        console.log('Amount:' + parseInt(
                            AccountUtils.calculateRaw(amount, 6)));
                        const inReplyToUserIdAccount = await comp.sidewinderService.getAccount('twitter',
                            tweetCreateEvent.in_reply_to_screen_name);
                        console.log('Got account for:' + tweetCreateEvent.in_reply_to_screen_name + ', isNew:' + inReplyToUserIdAccount.isNew);
                        const transfer = await comp.sidewinderService.transfer(
                            accountResponse.api,
                            inReplyToUserIdAccount.api,
                            parseInt(
                                AccountUtils.calculateRaw(
                                    amount, 6)));
                        console.log('Transfer Done');
                        console.log(transfer);
                        console.log('Transfer result:'
                            + JSON.stringify(
                                transfer, null, 2));
                        returnVal.push('transfer sent');

                        if (inReplyToUserIdAccount.isNew) {
                            const tweetResult = await comp.tweet('@'
                                + tweetCreateEvent.in_reply_to_screen_name
                                + ', welcome to @' + comp.botName + '. Your initial tipping balance is '
                                + AccountUtils.calculateUnit(
                                    inReplyToUserIdAccount.account.data.available_balance.toFixed(),
                                    6))
                            console.log(
                                'Initial balance tweet response: '
                                + JSON.stringify(
                                tweetResult, null, 2));
                            returnVal.push('initial balance tweet response 2');

                            // -- now let us reward the tipper with 100 because they introduced a new account.
                            await comp.sidewinderService.rewardsService.reward('twitter', sourceScreenName, 0.1);
                            const isFollowing = await comp.sidewinderService.isFollowing('twitter', sourceScreenName);
                            console.log('twitter ' + sourceScreenName + ' is following == ' + isFollowing);
                            if (isFollowing) {

                                await comp.sendMessage(
                                    sourceId,
                                    'Congratulations @' + sourceScreenName +
                                    ', you were just rewarded with 0.1 XRP points for acknowledging @'
                                    + tweetCreateEvent.in_reply_to_screen_name + ', who is a new user on @tipsandthanks.');

                            }
                        }
                        else {
                            // -- now let us reward the tipper with twenty for using the system.
                            await comp.sidewinderService.rewardsService.reward('twitter', sourceScreenName, 0.01);
                            const isFollowing = await comp.sidewinderService.isFollowing('twitter', sourceScreenName);
                            console.log('twitter ' + sourceScreenName + ' is following == ' + isFollowing);
                            if (isFollowing) {

                                await comp.sendMessage(
                                    sourceId,
                                    'Congratulations @' + sourceScreenName +
                                    ', you were just rewarded with 0.01 XRP points for acknowledging @'
                                    + tweetCreateEvent.in_reply_to_screen_name);

                            }
                        }

                        if (await comp.sidewinderService.isFollowing('twitter', tweetCreateEvent.in_reply_to_screen_name)) {

                            await comp.sendMessage(
                                tweetCreateEvent.in_reply_to_user_id,
                                'Congratulations, you were just acknowledged with ' + amount + ' THNX points by @' + sourceScreenName);

                        }

                    }
                }
            }
            resolve(returnVal);
        });
    }

    async onAccountApiPayload(body, returnVal) {

        const comp = this;
        const payload =  body ;
        console.log(JSON.stringify(body, null, 2));;
        returnVal.push('Getting started');
        if (typeof payload.for_user_id === 'string') {

            console.log('---------------->');
            if (typeof payload.direct_message_events !== 'undefined') {
                returnVal.push('handling direct message events.');
                const promises = payload.direct_message_events.map(
                    (messageEvent) => {
                        return comp.handleMessage(payload, messageEvent);
                    });
                console.log('COUNT MESSAGE PROMISES:' + promises.length);
                const values = await Promise.all(promises);
                console.log('AWAITED MESSAGE PROMISES:' + promises.length + ' '
                    + JSON.stringify(values, null, 2));
            }
            if (typeof payload.follow_events !== 'undefined') {
                console.log('handling follow events.');
                const promises = payload.follow_events.map((followEvent) => {
                    return comp.handleFollowEvent(followEvent);
                });
                console.log('COUNT FOLLOW PROMISES:' + promises.length);
                const values = await Promise.all(promises);
                console.log('AWAITED FOLLOW PROMISES:' + promises.length + ' '
                    + JSON.stringify(values, null, 2));

            }
            if (typeof payload.favorite_events !== 'undefined') {
                const promises = payload.favorite_events.map((favorite_event) => {
                    return comp.handleFavoriteEvent(favorite_event);
                });
                console.log('COUNT FAVORITE PROMISES:' + promises.length);
                const values = await Promise.all(promises);
                console.log('AWAITED FAVORITE PROMISES:' + promises.length + ' '
                    + JSON.stringify(values, null, 2));
            }
            if (typeof payload.tweet_create_events !== 'undefined') {
                console.log(
                    'handling tweet events:' + JSON.stringify(payload, null,
                    2));

                const promises = payload.tweet_create_events.map(
                    async (tweetCreateEvent) => {
                        return comp.handleTweetEvent(tweetCreateEvent);
                    });
                console.log('COUNT TWEET PROMISES:' + promises.length);
                const values = await Promise.all(promises);
                console.log('AWAITED TWEET PROMISES:' + promises.length + ' '
                    + JSON.stringify(values, null, 2));
            }
            console.log('<----------------');
        }

        if (payload.user_event && typeof payload.user_event
            === 'object') {
            if (payload.user_event.revoke && typeof payload.user_event.revoke
                === 'object') {
                //const emitter = userActivityEmitters.get(payload.user_event.revoke.source.user_id);
                //if (emitter) emitter.emit('revoke', payload.user_event.revoke);
                //middleware.emit('event', 'revoke', payload.user_event.revoke.source.user_id, payload.user_event.revoke);
                console.log('!!EVENT: Name:' + revoke + ' -- '
                    + payload.user_event.revoke.source.user_id + ' '
                    + JSON.stringify(payload.user_event.revoke, null, 2));

                return;
            }
        }

    }

}

module.exports.TwitterService = TwitterService;