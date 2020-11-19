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

    handleSlash(team, senderScreenName, text) {
        const comp = this;
        const returnVal = [];
        return new Promise(async (resolve) => {

                // -- let us test to see if the source name is the name of the bot
                if (senderScreenName === comp.botName) {
                    console.log('Ignoring dm by the bot');
                    returnVal.push('Ignoring dm by the bot');
                    resolve('Cheeky who do you think you are!?');
                    return;
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

                    if ( text
                        === 'balance') {
                        returnVal.push('sending balance');
                        /*const sendMessageResponse = await comp.sendMessage(
                            senderId,
                            'Your @PayburnerBot tipping balance is: '
                            + AccountUtils.calculateUnit(
                            accountResponse.account.data.available_balance.toFixed(),
                            6))*/
                        returnVal.push('sent balance');
                        const msg = 'Your @PayburnerBot tipping balance is: '
                            + AccountUtils.calculateUnit(
                                accountResponse.account.data.available_balance.toFixed(),
                                6);
                        console.log(
                            'BALANCE DM Sent:' + JSON.stringify(
                            msg));
                        resolve(msg);
                        return;

                    } else if (text
                        === 'help') {
                        returnVal.push('sending help');
                        /*const sendHelpMessage = await comp.sendMessage(
                            senderId,
                            'Welcome to @PayburnerBot.  Commands include: help, balance, info')
                        returnVal.push('sent help');
                        console.log(
                            'HELP DM Sent:' + JSON.stringify(
                            sendHelpMessage));*/
                        const msg = 'Welcome to @PayburnerBot.  Commands include: help, balance, info';
                        resolve(msg);
                        return;

                    } else if (text
                        === 'info') {
                        returnVal.push('sending info');
                        /*
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
                            sendMessageResult));*/
                        const msg = 'Information. The fee for tipping is '
                            +
                            AccountUtils.calculateUnit(
                                comp.sidewinderService.tokenDefinition.data.transaction_fee.toFixed(
                                    0), 6) + '.';
                        resolve(msg);
                        return;
                    } else {
                        returnVal.push('sending generic');
                        /*const sendMessageResult = await comp.sendMessage(
                            senderId,
                            'Welcome to the Payburner Bot.  Commands include: help, balance, info')
                        returnVal.push('sent generic');
                        console.log(
                            'GENERIC DM Sent:' + JSON.stringify(
                            sendMessageResult));
                        const msg = 'Welcome to @PayburnerBot.  Commands include: help, balance, info';*/
                        resolve(msg);
                        return;
                    }
                }
            }
        );
    }

}

module.exports.SlackService = SlackService;