const {Api} = require( "./Api");
const {SecretService} = require('./SecretService');
class DataService {

    constructor( docClient, secretManager ) {
        this.secretService = new SecretService(secretManager);
        this.docClient = docClient;
        this.USER_METRICS = {
            sidewinder_mx_account_sends_count_counter : {
                metric: 'sidewinder_mx_account_sends_count_counter',
                display: 'Count Tips Made',
                keyTemplate: this.addressMetricKey
            },
            sidewinder_mx_account_sends_amount_counter : {
                metric: 'sidewinder_mx_account_sends_amount_counter',
                display: 'Amount Tips Made',
                keyTemplate: this.addressMetricKey
            },
            sidewinder_mx_account_receives_count_counter : {
                metric: 'sidewinder_mx_account_receives_count_counter',
                display: 'Count Tips Received',
                keyTemplate: this.addressMetricKey
            },
            sidewinder_mx_account_receives_amount_counter : {
                metric: 'sidewinder_mx_account_receives_amount_counter',
                display: 'Amount Tips Received',
                keyTemplate: this.addressMetricKey
            }
        }

        this.TOKEN_METRICS = {
            sidewinder_mx_environment_token_transactions_count_counter : {
                metric: 'sidewinder_mx_environment_token_transactions_count_counter',
                display: 'Count Tips Made for Token',
                keyTemplate: this.tokenMetricKey
            },
            sidewinder_mx_environment_token_transactions_amount_counter : {
                metric: 'sidewinder_mx_environment_token_transactions_amount_counter',
                display: 'Amount Tips Made for Token',
                keyTemplate: this.tokenMetricKey
            }
        }
    }

    isFollowing(platform, id ) {
        const self = this;
        if (typeof id === "number") {
            id = id.toFixed(0);
        }
        return new Promise((resolve, reject) => {
            const params = {
                TableName: "sidewinder_social_account_follows",
                KeyConditionExpression: "socialplatform = :socialplatform and socialid = :socialid",
                ExpressionAttributeValues: {
                    ":socialid": id,
                    ":socialplatform": platform
                }
            };
            console.log('FOLLOW QUERY:' + JSON.stringify(params, null, 2));

            self.docClient.query(params, function (err, data) {
                if (err) {
                    console.error("Unable to query. Error:",
                        JSON.stringify(err, null, 2));
                    resolve(false);
                } else {
                    console.log('Following Items Len:' + data.Items.length);
                    if (data.Items.length === 0) {
                        resolve(false)
                    } else {
                        resolve(true);
                    }
                }
            });
        })
    }

    getTokenMetrics(environment, token ) {
        const self = this;
        return new Promise(async (resolve) => {
            const promises = [];
            Object.keys( self.TOKEN_METRICS ).forEach((key) => {
                promises.push(self.getTokenMetric(self.TOKEN_METRICS[key], environment, token));
            });
            resolve(await Promise.all(promises));
        });
    }

    getUserMetrics(environment, token, api) {
        const self = this;
        return new Promise(async (resolve) => {
            const promises = [];
            Object.keys( self.USER_METRICS ).forEach((key) => {
               promises.push(self.getUserMetric(self.USER_METRICS[key], environment, token, api));
            });
            resolve(await Promise.all(promises));
        });
    }

    metricExists(metric, key) {
        const self = this;
        return new Promise((resolve) => {
            const params = {
                TableName: "sidewinder_metrics",
                KeyConditionExpression: "sw_metric = :sw_metric and sw_key = :sw_key",
                ExpressionAttributeValues: {
                    ":sw_metric": metric,
                    ":sw_key": key
                }
            };

            self.docClient.query(params, function (err, data) {
                if (err) {
                    resolve(false);
                } else {
                    if (data.Items.length === 0) {
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                }
            });
        });
    }

    getUserMetric(metricDefinition, environment, token, api) {
        const self = this;
        return new Promise((resolve) => {
            const params = {
                TableName: "sidewinder_metrics",
                KeyConditionExpression: "sw_metric = :sw_metric and sw_key = :sw_key",
                ExpressionAttributeValues: {
                    ":sw_metric": metricDefinition.metric,
                    ":sw_key": metricDefinition.keyTemplate(environment, token, api)
                }
            };
            console.log('get metric:' + JSON.stringify(params, null, 2));

            self.docClient.query(params, function (err, data) {
                if (err) {
                    resolve(false);
                } else {
                    console.log('got metric:' + JSON.stringify(data, null, 2));
                    if (data.Items.length > 0) {
                        resolve(
                        {
                            metric: metricDefinition.metric,
                                key: metricDefinition.keyTemplate(environment, token, api),
                            display: metricDefinition.display,
                            value: typeof data.Items[0].sw_value === 'undefined' ? 0 : data.Items[0].sw_value
                        } );
                    }
                    else {
                        resolve({
                            metric: metricDefinition.metric,
                            key: metricDefinition.keyTemplate(environment, token, api),
                            display: metricDefinition.display,
                            value: 0
                        });
                    }
                }
            });
        });
    }

    getTokenMetric(metricDefinition, environment, token ) {
        const self = this;
        return new Promise((resolve) => {
            const params = {
                TableName: "sidewinder_metrics",
                KeyConditionExpression: "sw_metric = :sw_metric and sw_key = :sw_key",
                ExpressionAttributeValues: {
                    ":sw_metric": metricDefinition.metric,
                    ":sw_key": metricDefinition.keyTemplate(environment, token )
                }
            };

            self.docClient.query(params, function (err, data) {
                if (err) {
                    resolve(false);
                } else {

                    if (data.Items.length > 0) {
                        resolve(
                            {
                                metric: metricDefinition.metric,
                                key: metricDefinition.keyTemplate(environment, token ),
                                display: metricDefinition.display,
                                value: typeof data.Items[0].sw_value === 'undefined' ? 0 : data.Items[0].sw_value
                            } );
                    }
                    else {
                        resolve({
                            metric: metricDefinition.metric,
                            key: metricDefinition.keyTemplate(environment, token),
                            display: metricDefinition.display,
                            value: 0
                        });
                    }
                }
            });

        });
    }

    getMetric(metric, key) {
        const self = this;
        return new Promise((resolve) => {
            const params = {
                TableName: "sidewinder_metrics",
                KeyConditionExpression: "sw_metric = :sw_metric and sw_key = :sw_key",
                ExpressionAttributeValues: {
                    ":sw_metric": metric,
                    ":sw_key": key
                }
            };

            self.docClient.query(params, function (err, data) {
                if (err) {
                    resolve(false);
                } else {
                    if (data.Items.length === 0) {
                        resolve(data.Items[0].sw_value);
                    }
                    else {
                        resolve(0);
                    }
                }
            });
        });
    }

    addressMetricKey(environment, token, api) {
        if (typeof environment === 'undefined') {
            throw 'Missing environment';
        }
        if (typeof token === 'undefined') {
            throw 'Missing token';
        }
        if (typeof api === 'undefined') {
            throw 'Missing address';
        }
        return 'environment_' + environment + '_token_' + token + '_address_' + api.getAddress();
    }

    tokenMetricKey(environment, token ) {
        if (typeof environment === 'undefined') {
            throw 'Missing environment';
        }
        if (typeof token === 'undefined') {
            throw 'Missing token';
        }

        return 'environment_' + environment + '_token_' + token ;
    }

    metricForAddress( metricDefintion, environment, token, address, value) {
        return {
            metric: metricDefintion.metric,
                key: metricDefintion.keyTemplate(environment, token, address),
            value: value
        }
    }

    metricForToken( metricDefintion, environment, token, value) {
        return {
            metric: metricDefintion.metric,
            key: metricDefintion.keyTemplate(environment, token),
            value: value
        }
    }

    publishTransferMetrics(environment, token, from, to, amount) {

        const updates = [];
        const self = this;

        // update froms --
        updates.push(
            self.metricForAddress(self.USER_METRICS.sidewinder_mx_account_sends_count_counter,
            environment, token, from, 1)
        );
        updates.push(
            self.metricForAddress(self.USER_METRICS.sidewinder_mx_account_sends_amount_counter,
                environment, token, from, amount)
        );

        updates.push(
            self.metricForAddress(self.USER_METRICS.sidewinder_mx_account_receives_count_counter,
                environment, token, to, 1)
        );
        updates.push(
            self.metricForAddress(self.USER_METRICS.sidewinder_mx_account_receives_amount_counter,
                environment, token, to, amount)
        );

        updates.push(
            self.metricForToken(self.TOKEN_METRICS.sidewinder_mx_environment_token_transactions_count_counter,
                environment, token, 1)
        );
        updates.push(
            self.metricForToken(self.TOKEN_METRICS.sidewinder_mx_environment_token_transactions_amount_counter,
                environment, token, amount)
        );

        const accountEnvironmentTransfersCountCounter = 'sidewinder_mx_environment_transactions_count_counter';
        updates.push(
            {
                metric: accountEnvironmentTransfersCountCounter,
                key: 'environment_' + environment,
                value: 1
            }
        );

        const accountEnvironmentPlatformTokenTransfersCountCounter = 'sidewinder_mx_environment_platform_token_transactions_count_counter';
        updates.push(
            {
                metric: accountEnvironmentPlatformTokenTransfersCountCounter,
                key: 'environment_' + environment + '_platform_' + from.platform + '_token_' + token,
                value: 1
            }
        );

        const accountEnvironmentPlatformTokenTransfersAmountCounter = 'sidewinder_mx_environment_platform_token_transactions_amount_counter';
        updates.push(
            {
                metric: accountEnvironmentPlatformTokenTransfersAmountCounter,
                key: 'environment_' + environment + '_platform_' + from.platform + '_token_' + token,
                value: amount
            }
        );

        const items = [];
        updates.forEach( (update) => {
            items.push(
                new Promise(async (resolve) => {
                    const exists = await self.metricExists(update.metric, update.key);
                    console.log('Metric exists:' + update.metric + ' ' + update.key + ' ' + exists);
                    if (exists) {
                        resolve({
                            Update: {
                                TableName: 'sidewinder_metrics',
                                Key: {
                                    sw_metric: update.metric,
                                    sw_key: update.key
                                },
                                UpdateExpression: 'SET sw_value = sw_value + :input_value',
                                'ExpressionAttributeValues': {
                                    ':input_value' : update.value
                                }
                            }
                        });
                    }
                    else {
                        resolve({
                            Put: {
                                TableName: 'sidewinder_metrics',
                                Item: {
                                    sw_metric: update.metric,
                                    sw_key: update.key,
                                    sw_value: update.value
                                }
                            }
                        });
                    }
                })
            );

        });
         return new Promise( async (resolve, reject) => {
             const values = await Promise.all(items);
             console.log('Items:' + JSON.stringify(values, null, 2));

             console.log('Sending Metrics to DB');
            self.docClient.transactWrite({ TransactItems: values }, function (err, data) {
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

    markFollow(platform, id) {

        const self = this;
        if (typeof id === "number") {
            id = id.toFixed(0);
        }
        return new Promise((resolve, reject) => {
            const dataBody = {
                socialplatform: platform,
                socialid: id
            };
            const params = {
                TableName: 'sidewinder_social_account_follows',
                Item: dataBody
            };
            self.docClient.put(params, function (err, data) {
                if (err) {
                    reject('Db error: ' + err);
                } else {
                    resolve( dataBody );
                }
            });
        })
    }

    getPlatFormAccount(platform, id) {
        return this.secretService.getPlatFormAccount(platform, id);
    }

    getApi(platform, id) {

        if (typeof id === 'number') {
            id = id.toFixed(0);
        }
        const self = this;
        return new Promise((resolve, reject) => {
            console.log('Getting Api:' + platform + ' ' + id );
            self.getPlatFormAccount(platform, id).then(
                (platformAccount) => {
                    const api = new Api();
                    api.initializeAddress(platformAccount.seed);
                    api.isNew = false;
                    api.platform = platform;
                    api.screenName = id;
                    resolve(api)
                }
            ).catch((error) => {
                const api = new Api();
                api.newAddress();
                api.isNew = true;
                api.platform = platform;
                api.screenName = id;
                const seed = api.seed;
                console.log('Saving platform account:' + platform + ' ' + id + ' ' + api.getAddress());
                self.secretService.putPlatformAccount(platform, id, api.getAddress(), seed)
                .then((ok)=>{
                    console.log('Saved '+ platform + ' ' + id + ' ' + api.getAddress() + ' ' + ok);

                    resolve(api);
                }).catch((nok) => {
                    console.log('Did not save platform account:'+ platform + ' ' + id + ' ' + api.getAddress() + ' ' + nok);
                    console.log(nok);
                    reject('Secret error: ' + nok);
                })
            })

        });
    }

}

module.exports.DataService = DataService;