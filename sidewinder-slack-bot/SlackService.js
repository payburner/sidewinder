const {AccountUtils} = require(
    "@payburner/keyburner-sidewinder-model/dist/npm");
const axios = require('axios');
class SlackService {

    constructor(config, sidewinderService) {

        this.config = config;
        this.sidewinderService = sidewinderService;
        this.botName = 'U01EP9E2NN8';

        this.webhookUrl = 'https://hooks.slack.com/services/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';
    }

    init() {

    }

    postNotification( text ) {
        const comp = this;
        return new Promise((resolve) => {
            axios.post(comp.webhookUrl, {text:text}, {
                headers: { 'Content-Type': 'application/json'}
            }).then((data) => {
                console.log('Notification success');
                resolve();
            }).catch((error) => {
                console.log('Notification Failed');
                console.log(error);
            })
        });
    }

    getAccount(senderScreenName) {
        const comp = this;
        return new Promise((resolve, reject) => {
            console.log('Getting Account:' + senderScreenName);
            comp.sidewinderService.getApi('slack', senderScreenName).then(
                (e) => {
                    console.log('Got Account Api:' + JSON.stringify(e, null, 2));
                    if (e.isNew) {
                        console.log('Funding Account:' + senderScreenName);
                        comp.sidewinderService.fund('slack', senderScreenName).then(
                            (funding) => {

                                comp.sidewinderService.getTokenAccount(
                                    e).then((account) => {
                                    console.log(
                                        'Got Token Account IsNew:'
                                        + senderScreenName);
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
                            console.log('Got Token Account Is Not New:'
                                + senderScreenName);
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

    handleMention(team, senderScreenName, text) {
        const comp = this;
        const returnVal = [];
        return new Promise(async (resolve) => {

                text = text.replace(/<@|>/g, '');

                console.log('SCREEN NAME:' + senderScreenName + ', BOT NAME:'
                    + comp.botName);

                // -- let us test to see if the source name is the name of the bot
                if (senderScreenName === comp.botName) {
                    console.log('Ignoring dm by the bot');
                    returnVal.push('Ignoring dm by the bot');
                } else {

                    console.log('Getting sender account');
                    const accountResponse = await comp.getAccount(
                        senderScreenName);
                    if (accountResponse.isNew) {
                        /* const tweetResponse = await comp.tweet(
                             'Welcome @'
                             + senderScreenName
                             + '. Your initial tipping balance is '
                             + AccountUtils.calculateUnit(
                             accountResponse.account.data.available_balance.toFixed(),
                             6)); */
                        /*console.log(
                            'Initial balance tweet response: '
                            + JSON.stringify(tweetResponse, null,
                            2));*/
                        await comp.postNotification('Welcome <@'
                            + senderScreenName
                            + '>. Your initial tipping balance is '
                            + AccountUtils.calculateUnit(
                                accountResponse.account.data.available_balance.toFixed(),
                                6));
                        console.log('Created new account for sender:' + senderScreenName);
                        returnVal.push('Initial balance tweet response');
                    }
                    const regex = /(.+)(\+)([\d]+$|[\d]+\.[\d]+$|\.[\d]+$)/;
                    const matches = text.match(regex);
                    console.log(
                        'matches:' + JSON.stringify(matches, null,
                        2));


                    if (matches !== null) {
                        const tokens = text.trim().split(/(\s+)/);
                        console.log('TOKENS:' + JSON.stringify(tokens));
                        console.log('TOKENS:' + tokens);

                        if (tokens.length !== 5) {
                            console.log('Invalid tokens length:' + text + ' -> ' + JSON.stringify(tokens));
                            return;
                        }
                        if (tokens[0] !== comp.botName){
                            console.log('First token must be the bot name but was not.');
                            return;
                        }
                        const inReplyToScreenName = tokens[2];
                        console.log('In Reply to is ====> ' + inReplyToScreenName);

                        const amount = matches[matches.length - 1];
                        console.log('Amount:' + parseInt(
                            AccountUtils.calculateRaw(amount, 6)));
                        const inReplyToUserIdAccount = await comp.getAccount(
                            inReplyToScreenName);
                        console.log('Sender Account:' + accountResponse.api.getAddress());

                        console.log('In Reply to Account:' + inReplyToUserIdAccount.api.getAddress());
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

                        console.log('Sending @@@@~~~~~!!!! --> ' + '<@' +
                            + inReplyToScreenName + '>'
                            + ', welcome to @Sidewinder. Your initial tipping balance is ');
                        console.log('Sending @@@@~~~~~!!!! --> ' + '<@' +
                            + inReplyToScreenName + '> , welcome to @Sidewinder. Your initial tipping balance is ');
                        await comp.postNotification('<@' + senderScreenName + '> just tipped ' + '<@' + inReplyToScreenName + '> with ' + amount );



                        if (inReplyToUserIdAccount.isNew) {
                            /* const tweetResult = await comp.tweet('@'
                                + inReplyToScreenName
                                + ', welcome to @PayburnerBot. Your initial tipping balance is '
                                + AccountUtils.calculateUnit(
                                    inReplyToUserIdAccount.account.data.available_balance.toFixed(),
                                    6))
                            console.log(
                                'Initial balance tweet response: '
                                + JSON.stringify(
                                tweetResult, null, 2)); */
                            console.log('Sending Notificaiton --> ' + '<@' +
                                + inReplyToScreenName + '>'
                                + ', welcome to @Sidewinder. Your initial tipping balance is '
                                + AccountUtils.calculateUnit(
                                    inReplyToUserIdAccount.account.data.available_balance.toFixed(),
                                    6));

                            await comp.postNotification('<@' + inReplyToScreenName + '>, welcome to @Sidewinder. Your initial tipping balance is ' + AccountUtils.calculateUnit(
                                inReplyToUserIdAccount.account.data.available_balance.toFixed(),
                                6) );

                            console.log('Created new account for inReplyTo:' + inReplyToScreenName);
                            returnVal.push('initial balance tweet response 2');
                        }

                    }

                }

                resolve(returnVal);
            }
        );
    }

}

module.exports.SlackService = SlackService;