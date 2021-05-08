const {Api} = require( "./Api");
const {SecretService} = require('./SecretService');
const {MetricsService} = require('./MetricsService');
const md5 = require('md5');
const uuid4 = require('uuid4')
class PlatformService {

    constructor( docClient, secretManager ) {
        this.secretService = new SecretService(secretManager);
        this.docClient = docClient;
        this.metricsService = new MetricsService(this.docClient);
    }

    registerPlatformUserIfNecessary(platform, user, firstBotAddress ) {
        const self = this;
        return new Promise(async (resolve) => {
            const dataBody = {
                id: platform + '/' + user.id,
                socialid: user.id,
                socialplatform: platform,
                socialname: typeof user.screen_name !== 'undefined' ? user.screen_name : 'none',
                first_bot_address: firstBotAddress,
                created_timestamp: new Date().toISOString()
            };
            const update = {
                Put: {
                    TableName: 'sidewinder_platform_user',
                    Item: dataBody,
                    ConditionExpression: "attribute_not_exists(id)"
                }
            }

            const registered = await self.transactionalWrite(update);
            if (registered) {
                const updates = [];
                updates.push(
                    {
                        metric: 'platform_users_count_counter',
                        key: 'platform_' + platform,
                        value: 1
                    },

                    {
                        metric: 'new_platform_users_count_counter',
                        key: 'platform_' + platform + '_bot_address_' + firstBotAddress,
                        value: 1
                    }
                    ,

                    {
                        metric: 'new_platform_users_count_counter',
                        key: 'bot_address_' + firstBotAddress,
                        value: 1
                    }
                );
                await this.metricsService.publishMetrics(updates);
            }
            resolve(registered);
        });
    }

    botUserHash( platform, user, botAddress ) {
        return md5(platform + '/' + user.id + '/' + botAddress);
    }

    isBotUserOptedOut( platform, user, botAddress ) {
        const self = this;

        return new Promise((resolve, reject) => {
            const params = {
                TableName: "sidewinder_bot_user_optout",
                KeyConditionExpression: "id_hash = :id_hash",
                ExpressionAttributeValues: {
                    ":id_hash": self.botUserHash( platform, user, botAddress)
                }
            };
            console.log('IsBotUserOptedOut:' + JSON.stringify(params, null, 2));
            self.docClient.query(params, function (err, data) {
                if (err) {
                    console.log('Error:', err);
                    console.log('Error:' + err);
                    console.log('Error:' + JSON.stringify(err));
                    resolve(false);
                } else {
                    console.log('isBotUserOptedOut Items Len:' + data.Items.length);
                    if (data.Items.length > 0) {
                        console.log('Found Bot User:' + JSON.stringify(data.Items[0], null, 2));
                        resolve(typeof data.Items[0].optedOut !== 'undefined' && data.Items[0].optedOut);
                    } else {
                        resolve(false);
                    }
                }
            });
        })
    }

    getBotUserOptionsByIdHash( id_hash ) {
        const self = this;

        return new Promise((resolve, reject) => {
            const params = {
                TableName: "sidewinder_bot_user_optout",
                KeyConditionExpression: "id_hash = :id_hash",
                ExpressionAttributeValues: {
                    ":id_hash": id_hash
                }
            };

            self.docClient.query(params, function (err, data) {
                if (err) {
                    resolve({status:500, error: err});
                } else {
                    console.log('get bot user by id hash Items Len:' + data.Items.length);
                    if (data.Items.length > 0) {
                        resolve({status:200, data:data.Items[0]});
                    } else {
                        resolve({status:404});
                    }
                }
            });
        })
    }

    optOutBotUser( id_hash ) {
        const self = this;

        return new Promise(async (resolve) => {
            const update = {
                Update: {
                    TableName: 'sidewinder_bot_user_optout',
                    Key: {
                        id_hash: id_hash
                    },
                    UpdateExpression: 'SET optedOut = :optedOut',
                    'ExpressionAttributeValues': {
                        ':optedOut' : true
                    }
                }
            }

            const registered = await self.transactionalWrite(update);
            if (registered) {
                try {
                    const botUser = await self.getBotUserOptionsByIdHash(id_hash);
                    const updates = [];
                    updates.push(
                        {
                            metric: 'bot_users_opted_out_count_counter',
                            key: 'bot_address_' + botUser.bot_address,
                            value: 1
                        },
                        {
                            metric: 'bot_users_opted_out_count_counter',
                            key: 'platform_' + botUser.socialplatform + '_bot_address_'
                                + botUser.bot_address,
                            value: 1
                        }
                    );
                    await this.metricsService.publishMetrics(updates);
                }
                catch(err) {
                    console.log('error on updating metrics:', err);
                }
            }

            resolve(registered);
        });
    }

    checkAccessToken( accessToken ) {
        const self = this;
        return new Promise(async (resolve) => {
            const params = {
                TableName: "sidewinder_bot_user_token",
                KeyConditionExpression: "id = :id",
                ExpressionAttributeValues: {
                    ":id": accessToken
                }
            };

            self.docClient.query(params, function (err, data) {
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

    createAccessToken( platform, user, botAddress ) {
        const self = this;
        return new Promise(async (resolve) => {
            const id = uuid4();
            const api = new Api();
            api.newAddress();
            const dataBody = {
                id: id,
                socialid: user.id,
                socialplatform: platform,
                socialname: typeof user.screen_name !== 'undefined' ? user.screen_name : 'none',
                bot_address: botAddress,
                token_address: api.getAddress(),
                created_timestamp: new Date().toISOString()
            };
            const update = {
                Put: {
                    TableName: 'sidewinder_bot_user_token',
                    Item: dataBody,
                    ConditionExpression: "attribute_not_exists(id)"
                }
            }

            const registered = await self.transactionalWrite(update);
            if (registered){
                dataBody.seed = api.seed;
                resolve({status:200, data: dataBody })
            }
            else {
                resolve({status:500,error:'We could not save the access token to the database.'});
            }
        });
    }

    optInBotUser( id_hash ) {
        const self = this;

        return new Promise(async (resolve) => {
            const update = {
                Update: {
                    TableName: 'sidewinder_bot_user_optout',
                    Key: {
                        id_hash: id_hash
                    },
                    UpdateExpression: 'SET optedOut = :optedOut',
                    'ExpressionAttributeValues': {
                        ':optedOut' : false
                    }
                }
            }

            const registered = await self.transactionalWrite(update);
            if (registered) {
                try {
                    const botUser = await self.getBotUserOptionsByIdHash(id_hash);
                    const updates = [];
                    updates.push(
                        {
                            metric: 'bot_users_opted_in_count_counter',
                            key: 'bot_address_' + botUser.bot_address,
                            value: 1
                        },
                        {
                            metric: 'bot_users_opted_in_count_counter',
                            key: 'platform_' + botUser.socialplatform + '_bot_address_'
                                + botUser.bot_address,
                            value: 1
                        }
                    );
                    await this.metricsService.publishMetrics(updates);
                }
                catch(err) {
                    console.log('error on updating metrics:', err);
                }
            }

            resolve(registered);
        });
    }

    platformUserFromPlatformAndName(platform, screenName) {
        const self = this;

        return new Promise((resolve, reject) => {
            const params = {
                TableName: "sidewinder_platform_user",
                KeyConditionExpression: "socialname = :socialname AND socialplatform = :socialplatform",
                IndexName: 'socialname-socialplatform-index',
                ScanIndexForward: true,
                ExpressionAttributeValues: {
                    ":socialname": screenName,
                    ":socialplatform":platform
                }
            };

            self.docClient.query(params, function (err, data) {
                if (err) {
                    resolve({status: 500, error: err});
                } else {
                    console.log('getSocialUserByInternalAddress Items Len:' + data.Items.length);
                    if (data.Items.length > 0) {
                        resolve({status: 200, data: data.Items[0]})
                    } else {
                        resolve({status: 404, error: 'Not Found.'});
                    }
                }
            });
        })
    }

    registerBotUserIfNecessary(platform, user, botAddress ) {
        const self = this;
        return new Promise(async (resolve) => {
            const dataBody = {
                id: platform + '/' + user.id + '/' + botAddress,
                socialid: user.id,
                id_hash: md5(platform + '/' + user.id + '/' + botAddress),
                socialplatform: platform,
                socialname: typeof user.screen_name !== 'undefined' ? user.screen_name : 'none',
                bot_address: botAddress,
                created_timestamp: new Date().toISOString()
            };
            const update = {
                Put: {
                    TableName: 'sidewinder_bot_user',
                    Item: dataBody,
                    ConditionExpression: "attribute_not_exists(id)"
                }
            }

            const registered = await self.transactionalWrite(update);
            if (registered) {
                const updates = [];
                updates.push(
                    {
                        metric: 'bot_users_count_counter',
                        key: 'bot_address_' + botAddress,
                        value: 1
                    },
                    {
                        metric: 'bot_users_count_counter',
                        key: 'platform_' + platform + '_bot_address_' + botAddress,
                        value: 1
                    }

                );
                await this.metricsService.publishMetrics(updates);
            }

            resolve(registered);
        });

    }

    getPlatFormAccount(platform, id) {
        return this.secretService.getPlatFormAccount(platform, id);
    }

    getSocialUserByInternalAddress( internal_address ) {
        const self = this;

        return new Promise((resolve, reject) => {
            const params = {
                TableName: "sidewinder_social_account_mappings",
                KeyConditionExpression: "internal_address = :internal_address",
                IndexName: 'internal_address-index',
                ScanIndexForward: true,
                ExpressionAttributeValues: {
                    ":internal_address": internal_address
                }
            };

            self.docClient.query(params, function (err, data) {
                if (err) {
                    resolve({status: 500, error: err});
                } else {
                    console.log('getSocialUserByInternalAddress Items Len:' + data.Items.length);
                    if (data.Items.length > 0) {
                        resolve({status: 200, data: data.Items[0]})
                    } else {
                        resolve({status: 404, error: 'Not Found.'});
                    }
                }
            });
        })
    }

    transactionalWrite( update ) {
        const self = this;
        return new Promise( async (resolve, reject) => {

            console.log('Items:' + JSON.stringify([update], null, 2));

            console.log('Sending Write Request to DB');
            self.docClient.transactWrite({ TransactItems: [update] }, function (err, data) {
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

    getInternalAddressBySocialIdAndPlatform(platform, id) {
        const self = this;
        if (typeof id === "number") {
            id = id.toFixed(0);
        }
        return new Promise((resolve, reject) => {
            const params = {
                TableName: "sidewinder_social_account_mappings",
                KeyConditionExpression: "socialid = :socialid and socialplatform = :socialplatform",
                ScanIndexForward: true,
                ExpressionAttributeValues: {
                    ":socialplatform": platform,
                    ":socialid": id
                }
            };

            self.docClient.query(params, function (err, data) {
                if (err) {
                    resolve({status: 500, error: err});
                } else {
                    console.log('Following Items Len:' + data.Items.length);
                    if (data.Items.length > 0) {
                        resolve({status: 200, data: data.Items[0]})
                    } else {
                        resolve({status: 404, error: 'Not Found.'});
                    }
                }
            });
        })
    }

    writeToDbIfNecessary(platform, id, address) {
        const self = this;
        return new Promise(async (resolve) => {

            const getResponse = await self.getInternalAddressBySocialIdAndPlatform(platform, id);
            if (getResponse === 200 && getResponse.data.internal_address === address) {
                resolve(true);
                return;
            }

            const dataBody = {
                socialid: id,
                socialplatform: platform,
                internal_address: address,
                created_timestamp: new Date().toISOString()
            };
            const update = {
                Put: {
                    TableName: 'sidewinder_social_account_mappings',
                    Item: dataBody
                }
            }

            resolve(await self.transactionalWrite(update));
        });
    }

    getApi(platform, id) {

        if (typeof id === 'number') {
            id = id.toFixed(0);
        }
        const self = this;
        return new Promise((resolve, reject) => {
            console.log('Getting Api:' + platform + ' ' + id );
            self.getPlatFormAccount(platform, id).then( async (platformAccount) => {
                    const api = new Api();
                    api.initializeAddress(platformAccount.seed);
                    api.isNew = false;
                    api.platform = platform;
                    api.screenName = id;
                    try {
                        console.log('Write address to db ? '
                            + await this.writeToDbIfNecessary(platform, id,
                                api.getAddress()));
                    }
                    catch(error) {
                        console.log('Error writing address to db ? '
                            + JSON.stringify(error, null, 2));
                        console.log('Error writing address to db ? ' + error);
                    }
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
                .then(async (ok)=>{
                    console.log('Saved '+ platform + ' ' + id + ' ' + api.getAddress() + ' ' + ok);

                    try {
                        console.log('Write address to db ? '
                            + await this.writeToDbIfNecessary(platform, id,
                                api.getAddress()));
                    }
                    catch(error) {
                        console.log('Error writing address to db ? '
                            + JSON.stringify(error, null, 2));
                        console.log('Error writing address to db ? ' + error);
                    }

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

module.exports.PlatformService = PlatformService;