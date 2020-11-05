const {Api} = require( "./Api");
class DataService {

    constructor( docClient ) {

        this.docClient = docClient;
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
        const self = this;
        if (typeof id === "number") {
            id = id.toFixed(0);
        }

        return new Promise((resolve, reject) => {
            const params = {
                TableName: "sidewinder_social_account_mappings",
                KeyConditionExpression: "socialplatform = :socialplatform and socialid = :socialid",
                ExpressionAttributeValues: {
                    ":socialid": id,
                    ":socialplatform": platform
                }
            };

            self.docClient.query(params, function (err, data) {
                if (err) {
                    console.error("Unable to query. Error:",
                        JSON.stringify(err, null, 2));
                    reject(err);
                } else {

                    if (data.Items.length === 0) {
                        reject('Not found.')
                    } else {
                        resolve(data.Items[0]);
                    }
                }
            });
        })
    }

    getApi(platform, id) {

        if (typeof id === 'number') {
            id = id.toFixed(0);
        }
        const self = this;
        return new Promise((resolve, reject) => {

            self.getPlatFormAccount(platform, id).then(
                (platformAccount) => {
                    const api = new Api();
                    api.initializeAddress(platformAccount.seed);
                    api.isNew = false;
                    resolve(api)
                }
            ).catch((error) => {
                const api = new Api();
                api.newAddress();
                api.isNew = true;
                const seed = api.seed;

                const dataBody = {
                    socialplatform: platform,
                    socialid: id,
                    seed: seed,
                    address: api.getAddress()
                };
                const params = {
                    TableName: 'sidewinder_social_account_mappings',
                    Item: dataBody
                };
                self.docClient.put(params, function (err, data) {
                    if (err) {
                        reject('Db error: ' + err);
                    } else {
                        resolve( api );
                    }
                });

            })

        });
    }

}

module.exports.DataService = DataService;