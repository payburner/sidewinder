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

    postNotification(text) {
        const comp = this;
        return new Promise((resolve) => {
            axios.post(comp.webhookUrl, {text: text}, {
                headers: {'Content-Type': 'application/json'}
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

                        await comp.postNotification('Welcome <@'
                            + senderScreenName
                            + '>. Your initial tipping balance is '
                            + AccountUtils.calculateUnit(
                                accountResponse.account.data.available_balance.toFixed(),
                                6));
                        console.log(
                            'Created new account for sender:' + senderScreenName);
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
                            console.log('Invalid tokens length:' + text + ' -> '
                                + JSON.stringify(tokens));
                            return;
                        }
                        if (tokens[0] !== comp.botName) {
                            console.log(
                                'First token must be the bot name but was not.');
                            return;
                        }
                        const inReplyToScreenName = tokens[2];
                        console.log('In Reply to is ====> ' + inReplyToScreenName);

                        const amount = matches[matches.length - 1];
                        console.log('Amount:' + parseInt(
                            AccountUtils.calculateRaw(amount, 6)));
                        const inReplyToUserIdAccount = await comp.getAccount(
                            inReplyToScreenName);
                        console.log(
                            'Sender Account:' + accountResponse.api.getAddress());

                        console.log('In Reply to Account:'
                            + inReplyToUserIdAccount.api.getAddress());
                        const transfer = await comp.sidewinderService.transfer(
                            accountResponse.api,
                            inReplyToUserIdAccount.api,
                            parseInt(
                                AccountUtils.calculateRaw(
                                    amount, 6)));
                        if (transfer.status === 200) {
                            console.log('Transfer Successful:'
                                + JSON.stringify(
                                    transfer, null, 2));
                            await comp.postNotification(
                                '<@' + senderScreenName + '> just tipped ' + '<@'
                                + inReplyToScreenName + '> with ' + amount);
                        } else {
                            console.log('Transfer Failed:'
                                + JSON.stringify(
                                    transfer, null, 2));
                            await comp.postNotification(
                                '<@' + senderScreenName + '> got an error tipping '
                                + '<@' + inReplyToScreenName + '> with ' + amount
                                + '.  ' + transfer.error);
                        }

                        if (inReplyToUserIdAccount.isNew) {

                            console.log('Sending Notification --> ' + '<@' +
                                +inReplyToScreenName + '>'
                                + ', welcome to @Sidewinder. Your initial tipping balance is '
                                + AccountUtils.calculateUnit(
                                    inReplyToUserIdAccount.account.data.available_balance.toFixed(),
                                    6));

                            await comp.postNotification('<@' + inReplyToScreenName
                                + '>, welcome to @Sidewinder. Your initial tipping balance is '
                                + AccountUtils.calculateUnit(
                                    inReplyToUserIdAccount.account.data.available_balance.toFixed(),
                                    6));

                            console.log('Created new account for inReplyTo:'
                                + inReplyToScreenName);
                            returnVal.push('initial balance tweet response 2');
                        }

                    }

                }

                resolve(returnVal);
            }
        );
    }

    handleVisitHome(team, senderScreenName, tab) {
        const comp = this;
        const returnVal = [];
        return new Promise(async (resolve) => {

                let blocks = [];

                // -- let us test to see if the source name is the name of the bot
                if (senderScreenName === comp.botName) {
                    //console.log('Handle Response:' + JSON.stringify(response, null, 2));
                    blocks.push(
                        {
                            // Section with text and a button
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: "*Welcome!* \nThis is a home for the Sidewinder app. You are the bot user!"
                            }
                        },
                        // Horizontal divider line
                        {
                            type: "divider"
                        });

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
                        console.log(
                            'Created new account for sender:' + senderScreenName);
                        returnVal.push('Initial balance tweet response');
                    }

                    if (tab === 'home') {
                        blocks.push(
                            {
                                // Section with text and a button
                                type: "section",
                                text: {
                                    type: "mrkdwn",
                                    text: "*Welcome, <@" + senderScreenName
                                        + ">!* \nUse Sidewinder to show appreciation to your colleagues on Slack.  Visit https://www.tipsandthanks.com to learn more."
                                }
                            },
                            // Horizontal divider line
                            {
                                type: "divider"
                            });

                        const global = await comp.sidewinderService.getTokenMetrics();
                        let globalMetrics = '*Tips and Thanks Metrics*\n';
                        global.forEach((metric) => {
                            if (metric.metric.endsWith('_amount_counter')) {
                                globalMetrics += ' *' + metric.display + '*: '
                                    + AccountUtils.calculateUnit(
                                        metric.value.toFixed(),
                                        6) + '\n';
                            } else {
                                globalMetrics += ' *' + metric.display + '*: '
                                    + metric.value + '\n';
                            }
                        });

                        blocks.push({
                            // Section with text and a button
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: globalMetrics
                            }
                        });
                        // Horizontal divider line
                        blocks.push( {
                            type: "divider"
                        });


                        if (accountResponse.isNew) {
                            blocks.push(
                                {
                                    // Section with text and a button
                                    type: "section",
                                    text: {
                                        type: "mrkdwn",
                                        text: "*New User Award* \nAs a new user of Sidewinder, you have been awarded "
                                            + AccountUtils.calculateUnit(
                                                accountResponse.account.data.available_balance.toFixed(),
                                                6)
                                            + " Sidewinder points that you can use for tipping and saying thanks to colleagues."
                                    }
                                },
                                // Horizontal divider line
                                {
                                    type: "divider"
                                });
                        } else {
                            blocks.push(
                                {
                                    // Section with text and a button
                                    type: "section",
                                    text: {
                                        type: "mrkdwn",
                                        text: "*Balance* \nYou Sidewinder tipping points balance is  "
                                            + AccountUtils.calculateUnit(
                                                accountResponse.account.data.available_balance.toFixed(),
                                                6) + "."
                                    }
                                },
                                // Horizontal divider line
                                {
                                    type: "divider"
                                });
                        }

                        blocks.push(
                            {
                                // Section with text and a button
                                type: "section",
                                text: {
                                    type: "mrkdwn",
                                    text: "*Information* \nThe fee for tipping is "
                                        +
                                        AccountUtils.calculateUnit(
                                            comp.sidewinderService.tokenDefinition.data.transaction_fee.toFixed(
                                                0), 6) + "."
                                }
                            },
                            // Horizontal divider line
                            {
                                type: "divider"
                            });
                        blocks.push(
                            {
                                // Section with text and a button
                                type: "section",
                                text: {
                                    type: "mrkdwn",
                                    text: "*Help* \nThere are two primary ways to use Sidewinder :\n\n"
                                        + '1. Enter */sidewinder * plus balance or info or help.  For example, enter */sidewinder balance* anywhere to have your balance printed for you.  Nobody but you will see the information from your slash command.\n'
                                        +
                                        '2. Enter *@Sidewinder @USERNAME +AMOUNT* to tip or say thanks to another user.  For example: *@Sidewinder @SamanthaR +1.5* means \"Sidewinder please tip @SamanthaR 1.5 points\".'

                                }
                            },
                            // Horizontal divider line
                            {
                                type: "divider"
                            });

                        const metrics = await comp.sidewinderService.getUserMetrics(
                            accountResponse.api);
                        console.log('got metrics:' + JSON.stringify(metrics, null, 2));

                        let metricsString = '*Personal Metrics*\n';
                        metrics.forEach((metric) => {
                            if (metric.metric.endsWith('_amount_counter')) {
                                metricsString += ' *' + metric.display + '*: '
                                    + AccountUtils.calculateUnit(
                                        metric.value.toFixed(),
                                        6) + '\n';
                            } else {
                                metricsString += ' *' + metric.display + '*: '
                                    + metric.value + '\n';
                            }
                        });

                        blocks.push({
                            // Section with text and a button
                            type: "section",
                            text: {
                                    type: "mrkdwn",
                                    text: metricsString
                                }
                        });



                    } else {
                        blocks.push(
                            {
                                // Section with text and a button
                                type: "section",
                                text: {
                                    type: "mrkdwn",
                                    text: "*Welcome, <@" + senderScreenName
                                        + ">!* \nThis is a home for the Sidewinder app.  We do not know this tab."
                                }
                            },
                            // Horizontal divider line
                            {
                                type: "divider"
                            });
                    }

                }
                let view = {
                    type: 'home',
                    title: {
                        type: 'plain_text',
                        text: 'Home Page'
                    },
                    blocks: blocks
                }
                resolve(view);
            }
        );
    }
}

module.exports.SlackService = SlackService;