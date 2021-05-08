const {AccountUtils} = require(
    "@payburner/keyburner-sidewinder-model/dist/npm");
const axios = require('axios');
class SlackService {

    constructor(config, sidewinderService) {

        this.config = config;
        this.sidewinderService = sidewinderService;
        this.botName = config.botName;
        this.webhookUrl = config.webhookUrl;
    }

    init() {

    }

    getAccount(senderScreenName) {
        const comp = this;
        return new Promise((resolve, reject) => {
            console.log('Getting Account:' + senderScreenName);
            comp.sidewinderService.getApi('slack', senderScreenName).then(
                (e) => {
                    console.log(
                        'Got Account Api:' + JSON.stringify(e, null, 2));
                    if (e.isNew) {
                        console.log('!Funding Account:' + senderScreenName);
                        comp.sidewinderService.fund('slack',
                            senderScreenName).then(
                            (funding) => {
                                console.log('Got Funding: ' + senderScreenName + ' ' + JSON.stringify(funding, null, 2));
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
                            console.log('!!!Got Token Account Is Not New:'
                                + senderScreenName + ' ' + JSON.stringify(account) + ' ' + typeof account.status + ' ' + (account.status === 404));
                            if (typeof account.status !== 'undefined' && account.status === 404) {
                                console.log('!Beginning to fund!:' + senderScreenName);
                                comp.sidewinderService.fund('slack',
                                    senderScreenName).then(
                                    (funding) => {
                                        console.log('Got Funding: ' + senderScreenName + ' ' + JSON.stringify(funding, null, 2));
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
                            }
                            else {
                                console.log('Returning already funded!')
                                resolve({
                                    senderId: senderScreenName,
                                    api: e,
                                    account: account,
                                    isNew: false
                                })
                            }
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

                        const msg = 'Your <@' + this.botName + '> tipping balance is: '
                            + AccountUtils.calculateUnit(
                                accountResponse.account.data.available_balance.toFixed(),
                                6);
                        console.log(
                            'BALANCE DM Sent:' + JSON.stringify(
                            msg));
                        resolve(msg);
                        return;

                    }
                    else if ( text
                        === 'stats') {
                        const metrics = await comp.sidewinderService.getUserMetrics( accountResponse.api);

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
                        });

                        resolve(metricsString);
                        return;

                    }
                    else if ( text
                        === 'site') {

                        let metricsString = 'Visit https://www.tipsandthanks.com to learn more about this service.';

                        resolve(metricsString);
                        return;

                    }
                    else if (text
                        === 'help') {
                        returnVal.push('sending help');

                        const msg = 'Welcome to <@' + this.botName + '>.  Commands include: help, balance, info, stats, site';
                        resolve(msg);
                        return;

                    } else if (text
                        === 'info') {
                        returnVal.push('sending info');

                        const msg = 'Information. The fee for tipping is '
                            +
                            AccountUtils.calculateUnit(
                                comp.sidewinderService.tokenDefinition.data.transaction_fee.toFixed(
                                    0), 6) + '.';
                        resolve(msg);
                        return;
                    } else {
                        returnVal.push('sending generic');
                        const msg = 'Welcome to <@' + this.botName + '>.  Commands include: help, balance, info, stats, site';
                        resolve(msg);
                        return;
                    }
                }
            }
        );
    }

}

module.exports.SlackService = SlackService;