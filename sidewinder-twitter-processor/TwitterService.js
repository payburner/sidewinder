const Twit = require('twit');
const {AccountUtils} = require(
    "@payburner/keyburner-sidewinder-model/dist/npm");

class TwitterService {

    constructor(config, sidewinderService) {

        this.config = config;
        this.T = null;
        this.sidewinderService = sidewinderService;
        this.botName = 'PayburnerBot';

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
        console.log('>>>> !!!!!');
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

    getAccount(senderScreenName) {
        const comp = this;
        return new Promise((resolve, reject) => {
            comp.sidewinderService.getApi('twitter', senderScreenName).then((e) => {
                if (e.isNew) {
                    comp.sidewinderService.fund(senderScreenName).then(
                        (funding) => {

                            comp.sidewinderService.getTokenAccount(
                                e).then((account) => {
                                console.log(
                                    'Got Token Account IsNew:' + senderScreenName);
                                resolve({
                                    senderId: senderScreenName,
                                    api: e,
                                    account: account,
                                    isNew: true
                                });
                            })
                        });
                } else {
                    comp.sidewinderService.getTokenAccount(
                        e).then((account) => {
                        console.log('Got Token Account Is Not New:' + senderScreenName);
                        resolve({
                            senderId: senderScreenName,
                            api: e,
                            account: account,
                            isNew: false
                        })
                    });
                }
            });
        })
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

                        const accountResponse = await comp.getAccount(
                           senderScreenName );
                        if (accountResponse.isNew) {
                            const tweetResponse = await comp.tweet(
                                'Welcome @'
                                + senderScreenName
                                + '. Your initial tipping balance is '
                                + AccountUtils.calculateUnit(
                                accountResponse.account.data.available_balance.toFixed(),
                                6));
                            console.log(
                                'Initial balance tweet response: '
                                + JSON.stringify(tweetResponse, null,
                                2));
                            returnVal.push('Initial balance tweet response');
                        }

                        if (messageEvent.message_create.message_data.text
                            === 'balance') {
                            returnVal.push('sending balance');
                            const sendMessageResponse = await comp.sendMessage(
                                senderId,
                                'Your @PayburnerBot tipping balance is: '
                                + AccountUtils.calculateUnit(
                                accountResponse.account.data.available_balance.toFixed(),
                                6))
                            returnVal.push('sent balance');
                            console.log(
                                'BALANCE DM Sent:' + JSON.stringify(
                                sendMessageResponse));

                        } else if (messageEvent.message_create.message_data.text
                            === 'help') {
                            returnVal.push('sending help');
                            const sendHelpMessage = await comp.sendMessage(
                                senderId,
                                'Welcome to @PayburnerBot.  Commands include: help, balance, info')
                            returnVal.push('sent help');
                            console.log(
                                'HELP DM Sent:' + JSON.stringify(
                                sendHelpMessage));
                        } else if (messageEvent.message_create.message_data.text
                            === 'info') {
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
                        } else {
                            returnVal.push('sending generic');
                            const sendMessageResult = await comp.sendMessage(
                                senderId,
                                'Welcome to the Payburner Bot.  Commands include: help, balance, info')
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

    handleFollowEvent(followEvent) {
        const comp = this;
        const returnVal = [];
        return new Promise(async (resolve) => {
            if (followEvent.type === 'follow'
                && followEvent.target.screen_name
                === 'PayburnerBot') {
                const sourceScreenName = followEvent.source.screen_name;
                console.log('SCREEN NAME:' + sourceScreenName);
                const isFollowing = await comp.sidewinderService.isFollowing(
                    sourceScreenName)
                if (!isFollowing) {
                    const accountResponse = await comp.getAccount(
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
                const text = tweetCreateEvent.text; // @toocool2betrue @PayburnerBot +1
                if (typeof text !== 'undefined' && text !== null) {
                    const accountResponse = await comp.getAccount(
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
                        const inReplyToUserIdAccount = await comp.getAccount(
                            tweetCreateEvent.in_reply_to_screen_name);
                        const transfer = await comp.sidewinderService.transfer(
                            accountResponse.api,
                            inReplyToUserIdAccount.api,
                            parseInt(
                                AccountUtils.calculateRaw(
                                    amount, 6)));

                        console.log('Transfer:'
                            + JSON.stringify(
                                transfer, null, 2));
                        returnVal.push('transfer sent');

                        if (inReplyToUserIdAccount.isNew) {
                            const tweetResult = await comp.tweet('@'
                                + tweetCreateEvent.in_reply_to_screen_name
                                + ', welcome to @PayburnerBot. Your initial tipping balance is '
                                + AccountUtils.calculateUnit(
                                    inReplyToUserIdAccount.account.data.available_balance.toFixed(),
                                    6))
                            console.log(
                                'Initial balance tweet response: '
                                + JSON.stringify(
                                tweetResult, null, 2));
                            returnVal.push('initial balance tweet response 2');

                        }

                    }

                }
            }
            resolve(returnVal);
        });
    }

    async onAccountApiPayload(body, returnVal) {

        const comp = this;
        const payload = JSON.parse(body);
        console.log(body);
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