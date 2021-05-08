const uuid4 = require('uuid4');
const {RewardsService} = require( "@payburner/sidewinder-service/RewardsService");
const {PlatformService} = require( "@payburner/sidewinder-service/PlatformService");

const AWS = require('aws-sdk');
const {AccountUtils} = require(
    "@payburner/keyburner-sidewinder-model/dist/npm");

class BotBusinessLogic {

    constructor(config, egress) {
        this.config = config;
        this.botName = config.botName;
        this.egress = egress;
        this.rewardsService = new RewardsService(config);

        this.secretClient = new AWS.SecretsManager({
            region: 'us-west-1'
        });
        this.docClient = new AWS.DynamoDB.DocumentClient();
        this.platformService = new PlatformService(
            this.docClient, this.secretClient);

    }

    async init() {
        await this.rewardsService.init();
    }

    handleCall( decodedRequest ) {

    }

    handleDirectMessage(event) {
        const comp = this;
        console.log('Handling Direct Message:' + JSON.stringify(event, null, 2));
        return new Promise(async (resolve) => {
            console.log('Matcher:' + event.payload.msg_text.match(/(\+)([\d]+$|[\d]+\.[\d]+$|\.[\d]+$)/));
            if (event.payload.msg_text
                === '/help') {
                resolve('Hi there!  Welcome to ' + comp.botName
                    + '.  Commands include: /help, /balance, /deposit, /withdraw, /transfer');
            }
            else if (event.payload.msg_text
                === '/balance') {
                console.log('Getting balance:' + JSON.stringify(event, null, 2));
                const senderRewardsAccount = await comp.rewardsService.getAccount(
                    event.platform,
                    event.users.originator.id);

                resolve(
                    'Your ' + comp.botName
                    + ' XRP balance is: '
                    + AccountUtils.calculateUnit(
                    senderRewardsAccount.account.data.available_balance.toFixed(),
                    6) + ' XRP');
            }
            else if (event.payload.msg_text
                === '/overage') {
                const senderRewardsAccount = await comp.rewardsService.getAccount(
                    event.platform,
                    event.users.originator.id);

                resolve(
                    'Your ' + comp.botName
                    + ' XRP over balance is: '
                    + AccountUtils.calculateUnit(
                    senderRewardsAccount.account.data.over_balance.toFixed(),
                    6) + ' XRP');
            }
            else if (event.payload.msg_text
                === '/address') {
                const senderRewardsAccount = await comp.rewardsService.getAccount(
                    event.platform,
                    event.users.originator.id);

                resolve(
                    'Your ' + comp.botName
                    + ' XRP address is ' + senderRewardsAccount.getAddress());
            }
            else if (event.payload.msg_text
                === '/deposit') {
                const token = await comp.rewardsService.getToken();
                const senderRewardsAccount = await comp.rewardsService.getAccount(
                    event.platform,
                    event.users.originator.id);
                if (typeof token.data.maximum_balance !== 'undefined') {
                    if (senderRewardsAccount.account.data.available_balance > token.data.maximum_balance) {
                        resolve('Unfortunately, your balance (' + AccountUtils.calculateUnit(
                            senderRewardsAccount.account.data.available_balance.toString(), 6)
                            + ' XRP) is more than the maximum allowed balance of Payburner Social wallets ('
                            + AccountUtils.calculateUnit(
                                token.data.maximum_balance.toString(), 6) + ' XRP) and you must not deposit any more.');
                        return;
                    }
                    else if (senderRewardsAccount.account.data.available_balance === token.data.maximum_balance) {
                        resolve('Unfortunately, your balance (' + AccountUtils.calculateUnit(
                            senderRewardsAccount.account.data.available_balance.toString(), 6)
                            + ' XRP) is equal to the maximum allowed balance of Payburner Social wallets (' +
                           AccountUtils.calculateUnit(
                               token.data.maximum_balance.toString(), 6)
                            + ' XRP) and you must not deposit any more.  Please withdraw your overage amount.');
                        return;
                    }
                    else {
                        resolve('To deposit XRP to your ' + event.platform + ' XRP Wallet, please send XRP to the following:\n\n XRP address:\n' +
                            comp.config.underlying_address + '\n\nDestination Tag:\n' + senderRewardsAccount.account.destination_tag
                            + '\n\nPlease note, the maximum allowed XRP balance of Payburner Social wallets is (' +
                                AccountUtils.calculateUnit(token.data.maximum_balance.toString(), 6)
                                + ' XRP).  Any more that you send above '
                                + AccountUtils.calculateUnit((token.data.maximum_balance-senderRewardsAccount.account.data.available_balance).toString(), 6)
                                + ' XRP will be placed in your overage balance and must be flushed to the originating XRP address.');
                    }
                }
                else {
                    resolve('To deposit XRP to your ' + event.platform + ' XRP Wallet, please send XRP to the following:\n\n XRP address:\n' +
                        comp.config.underlying_address + '\n\nDestination Tag:\n' + senderRewardsAccount.account.destination_tag + '\n\n');
                }
            }
            else if (event.payload.msg_text.startsWith(
                '/withdraw')) {
                const tokens = event.payload.msg_text.split(
                    '\ ');
                if (tokens.length !== 3 && tokens.length !== 4) {
                    resolve(
                        'To withdraw your XRP, please submit the following command:\n\n /withdraw AMOUNT A_VALID_XRP_ADDRESS OPTIONAL_DESTINATION_TAG \n\nFor example \n\n/withdraw 1 rMwXJutPuyiNXXMuJCrLGfXVLzfhMFZXWA\n\n  If you wish to withdraw your XRP to an exchange hosted account, please include the optional destination tag.  For example: \n\n/withdraw 1 rMwXJutPuyiNXXMuJCrLGfXVLzfhMFZXWA 23423423423\n\n Please note that in all cases we can not be responsible for you specifying an incorrect address or destination tag.\n\nThe minimum XRP withdrawal amount is 0.0001 XRP and the maximum is 10 XRP.');
                }
                else {
                    const response = await comp.rewardsService.redeem(
                        event.platform,
                        event.users.originator.id, tokens[1],
                        tokens[2],
                        tokens.length === 4 ? tokens[3] : null);
                    resolve(
                        response);
                }
            }
            else if (event.payload.msg_text.startsWith(
                '/transfer')) {
                const tokens = event.payload.msg_text.split(
                    '\ ');
                if (tokens.length < 3) {
                    resolve(
                        'To transfer XRP to someone else, please submit the following command:\n\n /transfer AMOUNT A_VALID_SOCIAL_ID \n\nFor example \n\n/transfer 1 chrisopler@yahoo.com\n\n The minimum XRP transfer amount is 0.0001 XRP and the maximum is 10 XRP.');
                }
                else {

                    const country = typeof event.users.originator.country !== 'undefined' && event.users.originator.country !== 'UNKNOWN' ? event.users.originator.country : 'US';
                    console.log('country:' + country);
                    let rawId = '';
                    let protocol = 'unknown';
                    for (var idx = 2; idx < tokens.length; idx++) {
                        if (rawId === '') {
                            if (tokens[idx].startsWith('mailto:')) {
                               protocol = 'email';
                               rawId = tokens[idx].substring(7);

                            }
                            else if (tokens[idx].startsWith('twitter:')) {
                                protocol = 'twitter';
                                rawId = tokens[idx].substring(8);
                            }
                            else if (tokens[idx].startsWith('tel:')) {
                                protocol = 'phone';
                                rawId = tokens[idx].substring(4);
                            }
                            else if (tokens[idx].startsWith('sms:')) {
                                protocol = 'phone';
                                rawId = tokens[idx].substring(4);
                            }
                            else {
                                rawId = tokens[idx];
                            }
                        }
                        else {
                            rawId = rawId + ' ' + tokens[idx];
                        }
                    }


                    let targetPlatform = event.platform;
                    if (protocol !== 'unknown') {
                        targetPlatform = protocol;
                    }
                    console.log('Target Id:' + targetPlatform + ' ' + rawId.trim());
                    const idResponse = await comp.egress.formatId(targetPlatform, country, rawId.trim());
                    console.log('IdResponse:' + JSON.stringify(idResponse, null, 2));
                    if (idResponse.status !== 200) {
                        await comp.reply(event, 'The transfer to id is invalid:' + idResponse.error);
                        return;
                    }
                    console.log('id:' + (typeof idResponse) );
                    console.log('id:' + idResponse );
                    console.log('id:' + JSON.stringify(idResponse, null, 2));
                    const id = idResponse.data;
                    const registeredPlatformUser = await comp.platformService.registerPlatformUserIfNecessary(targetPlatform, {id:id}, comp.config.address);
                    console.log('Registered Platform User Mapping:' + registeredPlatformUser);
                    const registeredBotUser = await comp.platformService.registerBotUserIfNecessary(targetPlatform, {id:id}, comp.config.address);
                    console.log('Registered Bot User Mapping:' + registeredBotUser);
                    // -- set the registration status on the users before we send them to the business logic...

                    const response = await comp.rewardsService.transferUserToUser(
                        event.platform,
                        event.users.originator, {id:id, platform: targetPlatform}, tokens[1]);
                    console.log('Transfer response:' + response);
                    console.log('Transfer response:' + JSON.stringify(response, null, 2));
                    if (response.status !== 200) {
                        resolve(response.error);
                    }
                    else {
                        try {
                            console.log(
                                'sending notification to: ' + tokens[2]);
                            const response = await this.egress.sendMessage(
                                {
                                    platform: targetPlatform,
                                    correlation_id: typeof event.correlation_id
                                    !== 'undefined' ? event.correlation_id
                                        : uuid4(),
                                    recipient: {id: id},
                                    message: event.users.originator.screen_name + ' on ' + event.platform
                                        + ' transferred ' + tokens[1]
                                        + ' XRP to you.'
                                });
                            console.log('sent notification to: ' + id);
                        }
                        catch(error) {
                            console.log('failed to send notification to: ' + id, error);
                        }
                        resolve(response.data);
                    }
                }
            }
            else {
                // -- this handles responding to an e-mail with a +1
                const matches = event.payload.msg_text.match(/(\+)([\d]+$|[\d]+\.[\d]+$|\.[\d]+$)/);
                if (matches !== null && !event.users.target.is_bot) {
                    const country = typeof event.users.originator.country !== 'undefined' && event.users.originator.country !== 'UNKNOWN' ? event.users.originator.country : 'US';
                    console.log('country:' + country);

                    const amount = matches[matches.length-1];
                    const response = await comp.rewardsService.transferUserToUser(
                        event.platform,
                        event.users.originator,  event.users.target, amount);
                    console.log('Transfer response:' + response);
                    console.log('Transfer response:' + JSON.stringify(response, null, 2));
                    if (response.status !== 200) {
                        resolve(response.error);
                    }
                    else {
                        try {
                            console.log(
                                'sending notification to: ' + event.users.target.id);
                            const response = await this.egress.sendMessage(
                                {
                                    platform: event.platform,
                                    correlation_id: typeof event.correlation_id
                                    !== 'undefined' ? event.correlation_id
                                        : uuid4(),
                                    recipient: event.users.target,
                                    message: event.users.originator.id
                                        + ' liked something you sent and plussed ' + amount
                                        + ' XRP to you.'
                                });
                            console.log('sent notification to: ' + event.users.target.id + ' ' + JSON.stringify(response, null, 2));
                        }
                        catch(error) {
                            console.log('failed to send notification to: ' + event.users.target.id, error);
                        }
                        resolve(response.data);
                    }
                    return;
                }


                resolve('I beg your pardon. I did not understand that.  Commands include: /help, /balance, /deposit /withdraw, /transfer');
            }
        });
    }

    async reply( event, message ) {
        if (event.users.originator.is_following) {
            return await this.egress.sendMessage({
                recipient: event.users.originator,
                platform: event.platform,
                correlation_id: event.event_id,
                message: message
            });
        }
        else {
            console.log('No Reply Sent -- the originator is not following');
            return {
                status: 400, error: 'No Reply Sent -- the originator is not following'
            }
        }
    }

    async notifyTarget( event, message ) {
        if (event.users.target.is_following) {
            return await this.egress.sendMessage({
                recipient: event.users.target,
                platform: event.platform,
                correlation_id: event.event_id,
                message: message
            });
        }
        else {
            console.log('No Notify Sent -- the target is not following');
            return {
                status: 400, error: 'No Reply Sent -- the target is not following'
            }
        }
    }

    async handleMicroBlogEvent(event) {
        const comp = this;
        console.log('Micro Blog Event:' + JSON.stringify(event, null, 2));
        // let us try doing plus
        {
            const regex = /(.+)(\+)([\d]+$|[\d]+\.[\d]+$|\.[\d]+$)/;
            const text = event.payload.micro_blog_text;
            const matches = text.match(regex);
            console.log(
                'matches:' + JSON.stringify(matches, null,
                2));
            if (matches !== null) {
                const amount = parseFloat(matches[matches.length - 1]);
                const grantAmount = Math.min(amount, 5);
                if (grantAmount < amount) {
                    await this.reply( event,"The maximum plus amount is 5.");
                    return;
                }

                const response = await comp.rewardsService.transferUserToUser(
                    event.platform,
                    event.users.originator, event.users.target, amount.toString());
                console.log('Transfer response:' + response);
                console.log('Transfer response:' + JSON.stringify(response, null, 2));
                if (response.status !== 200) {
                    await this.reply( event,'There was an error transferring:' + error);
                    return;
                }
                else {
                    try {
                        await this.reply( event,  'You plussed ' + amount + ' XRP to @' + event.users.target.screen_name
                                     + ' on ' + event.platform);
                        console.log('sent notification to originator:  ' + JSON.stringify(response, null, 2));
                        await this.notifyTarget( event,   '@' + event.users.originator.screen_name
                            + ' plussed you with ' + amount
                            + ' XRP');
                        console.log('sent notification to target:  ' + JSON.stringify(response, null, 2));
                    }
                    catch(error) {
                        console.log('failed to send notification to: ', error);
                    }
                }
            }
        }
    }
}

module.exports.BotBusinessLogic = BotBusinessLogic;