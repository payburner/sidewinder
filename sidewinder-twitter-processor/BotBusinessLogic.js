const {MetricsService} = require(
    "@payburner/sidewinder-service/MetricsService");
const AWS = require('aws-sdk');
const {RemoteWalletClient} = require(
    "@payburner/sidewinder-service/RemoteWalletClient");

class BotBusinessLogic {

    constructor(config, egress) {
        this.config = config;
        this.botName = config.botName;
        this.egress = egress;
        this.remoteWalletClient = new RemoteWalletClient(config);
        this.metricsService = new MetricsService(
            new AWS.DynamoDB.DocumentClient());
        this.USER_METRICS = {
            tipsandthanks_sends_count_counter: {
                metric: 'tipsandthanks_sends_count_counter',
                display: 'Count Tips Made',
                keyTemplate: this.botPlatformKey
            },
            tipsandthanks_sends_amount_counter: {
                metric: 'tipsandthanks_sends_amount_counter',
                display: 'Amount Tips Made',
                keyTemplate: this.botPlatformKey
            },
            tipsandthanks_receives_count_counter: {
                metric: 'tipsandthanks_receives_count_counter',
                display: 'Count Tips Received',
                keyTemplate: this.botPlatformKey
            },
            tipsandthanks_receives_amount_counter: {
                metric: 'tipsandthanks_receives_amount_counter',
                display: 'Amount Tips Received',
                keyTemplate: this.botPlatformKey
            }
        }
    }

    botPlatformKey(botAddress, platform, id) {
        if (typeof botAddress === 'undefined') {
            throw 'Missing botAddress';
        }
        if (typeof platform === 'undefined') {
            throw 'Missing platform';
        }
        if (typeof id === 'undefined') {
            throw 'Missing id';
        }
        return 'bot_address_' + botAddress + '_platform_' + platform + '_id_'
            + id
    }

    getUserMetric(metricDefinition, event) {
        const self = this;
        const botAddress = self.config.address;
        const metric = metricDefinition.metric;
        const display = metricDefinition.display;
        const key = metricDefinition.keyTemplate(botAddress, event.platform,
            event.users.originator.id);
        return self.metricsService.getFullMetric(metric, display, key);

    }

    getUserMetrics(event) {
        const self = this;
        return new Promise(async (resolve) => {
            const promises = [];
            Object.keys(self.USER_METRICS).forEach((key) => {
                promises.push(
                    self.getUserMetric(self.USER_METRICS[key], event));
            });
            resolve(await Promise.all(promises));
        });
    }

    metricForUser(metricDefinition, botAddress, platform, id, value) {
        return {
            metric: metricDefinition.metric,
            key: metricDefinition.keyTemplate(botAddress, platform, id),
            value: value
        }
    }

    publishTransferMetrics(event, amount) {
        const botAddress = this.config.address;
        const updates = [];
        const self = this;

        // update froms --
        updates.push(
            self.metricForUser(
                self.USER_METRICS.tipsandthanks_sends_count_counter,
                botAddress, event.platform, event.users.originator.id, 1)
        );
        updates.push(
            self.metricForUser(
                self.USER_METRICS.tipsandthanks_sends_amount_counter,
                botAddress, event.platform, event.users.originator.id, amount)
        );

        updates.push(
            self.metricForUser(
                self.USER_METRICS.tipsandthanks_receives_count_counter,
                botAddress, event.platform, event.users.target.id, 1)
        );
        updates.push(
            self.metricForUser(
                self.USER_METRICS.tipsandthanks_receives_amount_counter,
                botAddress, event.platform, event.users.target.id, amount)
        );

        updates.push(
            {
                metric: 'tipsandthanks_total_count_counter',
                key: 'bot_address_' + this.config.address,
                value: 1
            }
        );

        updates.push(
            {
                metric: 'tipsandthanks_total_amount_counter',
                key: 'bot_address_' + this.config.address,
                value: amount
            }
        );

        return this.metricsService.publishMetrics(updates);
    }

    handleDirectMessage(event) {
        const comp = this;
        return new Promise(async (resolve) => {
            if (event.payload.msg_text
                === '/help') {
                resolve('Hi, @' + event.users.originator.screen_name
                    + '.  Welcome to @' + comp.botName
                    + '.  Commands include: /help, /stats');
            } else if (event.payload.msg_text
                === '/stats') {
                const metrics = await comp.getUserMetrics(event);

                let metricsString = 'Stats:\n\n';
                metrics.forEach((metric) => {
                    if (metric.metric.endsWith('_amount_counter')) {
                        metricsString += ' ' + metric.display + ':\n ' +
                            metric.value + '\n\n';
                    } else {
                        metricsString += ' ' + metric.display + ':\n '
                            + metric.value + '\n\n';
                    }
                })
                resolve(metricsString);
            } else {
                resolve(
                    'I beg your pardon, @' + event.users.originator.screen_name
                    + '. I did not understand that.  Commands include: /help, /stats');
            }
        });
    }

    async handleFollowEvent(event) {
        console.log('Follow Event:' + JSON.stringify(event, null, 2));
        // send XRP
        await this.egress.sendMessage({
            platform: event.platform,
            recipient: event.users.originator,
            correlation_id: event.event_id,
            message: "Hey, @" + event.users.originator.screen_name
                + "! Thanks for following me. :-)  You can play ping pong with me.  Just dm /ping or /pong to me. "
        });

        // send XRP Reward.
        await this.sendReward(event, event.users.originator, 0.001, "following me");
    }

    async onNewUser( event, user ) {
        await this.sendReward( event, user , 0.001, "joining");
    }

    async sendReward(event, user, unit_amount, event_name) {
        // send XRP Reward.
        const remoteWalletResponse = await this.remoteWalletClient.transferUnitAmount(
            event.platform,
            user, unit_amount);
        console.log(
            'rewardTo: ' + JSON.stringify(user, null, 2) +
            ', rewardName: ' + event_name +
            ', rewardAmount: ' + unit_amount +
            ', walletResponse: ' + JSON.stringify(remoteWalletResponse, null, 2));

        if (remoteWalletResponse.status === 200) {
            if (user.is_following) {
                await this.egress.sendMessage({
                    platform: event.platform,
                    recipient: user,
                    correlation_id: event.event_id,
                    message: " To thank you for " + event_name
                        + ", I have just sent " + unit_amount
                        + " XRP to your @PayburnerSocial XRP wallet to say thank you.  "
                        +
                        " Go there and direct message /help to find out more."
                });
            } else {
                console.log(
                    'Cant send reward notification because the originator is not following me, rewardTo: '
                    + JSON.stringify(user));
            }
        } else {
            console.log(
                'ALERT REWARDS FAILURE:' + JSON.stringify(remoteWalletResponse,
                null, 2));
        }
    }

    async handleFavoriteEvent(event) {
        console.log('Favorite Event:' + JSON.stringify(event, null, 2));
        if (event.users.originator.is_following) {
            await this.egress.sendMessage({
                recipient: event.users.originator,
                correlation_id: event.event_id,
                message: "Hey, @" + event.users.originator.screen_name
                    + "! Thanks for liking my post. <3"
            });
        }
        // send XRP Reward.
        await this.sendReward(event, event.users.originator, 0.001, "liking one of my tweets");
    }

    async reply( event, message ) {
        if (event.users.originator.is_following) {
            return await this.egress.sendMessage({
                recipient: event.users.originator,
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

    async handleMicroBlogEvent(event) {
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
                    await this.reply( event,"@" + event.users.originator.screen_name
                            + "The maximum plus amount is 5.");
                    return;
                }
                await this.publishTransferMetrics(event, grantAmount);
                await this.sendReward(event, event.users.originator, 0.0001, "doing a plus 1 with me");
            }
        }
        // let us try doing negative
        {
            const regex = /(.+)(\-)([\d]+$|[\d]+\.[\d]+$|\.[\d]+$)/;
            const text = event.payload.micro_blog_text;
            const matches = text.match(regex);
            console.log(
                'matches:' + JSON.stringify(matches, null,
                2));
            if (matches !== null) {
                const amount = parseFloat(matches[matches.length - 1])*-1;
                const grantAmount = Math.max(amount, -5);
                if (grantAmount < amount) {
                    await this.reply(event, "@" + event.users.originator.screen_name
                            + "The maximum negative amount is -5.");
                    return;
                }
                await this.publishTransferMetrics(event, grantAmount);
                await this.sendReward(event, event.users.originator, 0.0001, "doing a plus 1 with me");
            }
        }
    }
}

module.exports.BotBusinessLogic = BotBusinessLogic;