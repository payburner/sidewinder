

const {Api} = require("./Api");
const {TransactionFactory} = require(
    "@payburner/keyburner-sidewinder-model/dist/npm/transactions/TransactionFactory");
const axios = require('axios');
const {DataService} = require("./DataService");
const {RewardsService} = require('./RewardsService');
 
class SidewinderService {

    constructor(secret, docClient, secretManager, config) {
        this.environment = config.environment;
        this.token = config.token;
        this.initialAmount = 10000000000000000000;
        this.grantAmount = 100000000;
        this.tokenDefinition = null;
        this.transactionFactory = new TransactionFactory();
        this.owner = new Api();
        this.owner.initializeAddress(secret);
        this.dataService = new DataService(docClient, secretManager);
        this.ownerId = config.botName;
        this.fundingButtonId = config.fundingButtonId;
        this.rewardsService = new RewardsService(config);
        this.config = config;
    }

    async init() {
        this.tokenDefinition = await this.getToken();
        if (this.tokenDefinition.status !== 200) {
            console.log('Creating Tipping token:' + this.token);
            this.tokenDefinition = await this.createToken();
            console.log('Token Create Response:' + JSON.stringify(this.tokenDefinition, null, 2));
            if (this.tokenDefinition.status !== 200) {
                throw "Could not create token";
            }
        }
       await this.rewardsService.init();
    }


    getAccount(platform, senderScreenName) {
        const comp = this;
        return new Promise((resolve, reject) => {
            console.log('Getting Tipping Account:' + senderScreenName);
            comp.getApi(platform, senderScreenName).then(
                (e) => {
                    console.log(
                        'Got Tipping Account Api:' + JSON.stringify(e, null, 2));
                    if (e.isNew) {
                        console.log('!Funding Account:' + senderScreenName);
                        comp.fund(platform,
                            senderScreenName).then(
                            (funding) => {
                                console.log('Got Tipping Funding: ' + senderScreenName + ' ' + JSON.stringify(funding, null, 2));
                                comp.getTokenAccount(
                                    e).then((account) => {
                                    console.log(
                                        'Got Tipping Token Account IsNew:'
                                        + senderScreenName);
                                    comp.rewardsService.getAccount(platform, senderScreenName).then((rewardsAccount)=>{
                                        console.log('Created Rewards Account');
                                        resolve({
                                            senderId: senderScreenName,
                                            api: e,
                                            account: account,
                                            isNew: true
                                        });
                                    });

                                })
                            });
                    } else {
                        comp.getTokenAccount(
                            e).then((account) => {
                            console.log('!!!Got Tipping Token Account Is Not New:'
                                + senderScreenName + ' ' + JSON.stringify(account) + ' ' + typeof account.status + ' ' + (account.status === 404));
                            if (typeof account.status !== 'undefined' && account.status === 404) {
                                console.log('!Beginning to fund!:' + senderScreenName);
                                comp.fund(platform,
                                    senderScreenName).then(
                                    (funding) => {
                                        console.log('Got Funding: ' + senderScreenName + ' ' + JSON.stringify(funding, null, 2));
                                        comp.getTokenAccount(
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

    getToken() {
        const self = this;
        return new Promise(async (resolve, relect) => {
            const environment = self.environment;
            const token = self.token;

            try {
                const result = await axios.get(
                    'https://sidewinder.payburner.com/v1/environment/'
                    + environment + '/token/'
                    + token,
                    {
                        headers: {'Content-Type': 'application/json'}
                    });
                let data = result.data;
                resolve(data);
            } catch (error) {
                console.log(
                    'TOKEN ERROR:' + JSON.stringify(error.response.data, null,
                    2) + ' ' + ('https://sidewinder.payburner.com/v1/environment/'
                    + environment + '/token/'
                    + token));
                resolve(error.response.data);
            }
        });
    }

    getUserMetrics(api) {
        return this.dataService.getUserMetrics(this.environment, this.token, api);
    }

    getTokenMetrics() {
        return this.dataService.getTokenMetrics(this.environment, this.token );
    }


    getTokenAccount(api) {
        const self = this;
        return new Promise(async (resolve, relect) => {
            const environment = self.environment;
            const token = self.token;
            const address = api.getAddress();
            try {
                const result = await axios.get(
                    'https://sidewinder.payburner.com/v1/environment/'
                    + environment + '/token/'
                    + token + '/address/' + address,
                    {
                        headers: {'Content-Type': 'application/json'}
                    });
                let data = result.data;
                resolve(data);
            } catch (error) {
                console.log('Error on Get Token Account:' +JSON.stringify(error.response.data, null, 2));
                resolve(error.response.data);
            }
        });
    }

    createToken() {
        const self = this;
        const e = this.environment;
        const t = this.token;
        const i = this.initialAmount;
        return new Promise(async (resolve) => {
            const environmentAccount = await self.getEnvironmentAccount(
                self.owner);

            // -- this should succeed.
            const payload = self.transactionFactory.newCreateTokenTransaction(
                environmentAccount.data.sequence + 1,
                environmentAccount.data.last_txn_id, e,
                t,
                0, 6, true, false, false);
            payload.initial_amount = i

            const signedTransaction = self.owner.signTokenCreateRequest(
                payload);

            try {
                const result = await axios.post(
                    'https://sidewinder.payburner.com/v1/environment/' + e
                    + '/txn',
                    signedTransaction.signedTransaction, {
                        headers: {'Content-Type': 'text/plain'}
                    });
                let data = result.data;
                console.log('OK:' + JSON.stringify(data,null,2));
                resolve(data);
            } catch (error) {
                console.log('NOK:' + JSON.stringify(error.response.data,null,2));
                resolve(error.response.data);

            }
        });

    }

    fund(platform, toscreenname) {
        const self = this;
        const environment = self.environment;
        const token = self.token;

        const a = this.grantAmount;
        return new Promise(async (resolve, reject) => {
            const d = await self.getApi(platform, toscreenname);
            const environmentAccount = await self.getEnvironmentAccount(
                self.owner);

            // -- this should succeed.
            const payload = self.transactionFactory.newTransferTransaction(
                environmentAccount.data.sequence + 1,
                environmentAccount.data.last_txn_id, environment,
                token,
                self.owner.getAddress(), d.getAddress(), a);
            const signedTransaction = self.owner.signTokenCreateRequest(
                payload);

            try {
                const result = await axios.post(
                    'https://sidewinder.payburner.com/v1/environment/'
                    + environment + '/txn',
                    signedTransaction.signedTransaction, {
                        headers: {'Content-Type': 'text/plain'}
                    });
                let data = result.data;
                resolve(data);
            } catch (error) {
                console.log(JSON.stringify(error.response.data, null, 2));
                resolve(error.response.data);
            }
        })
    }

    isFollowing(platform, senderId) {
        const comp = this;
        return new Promise((resolve) => {
            console.log('Check new follow for ' + senderId);
            console.log('Type of follow ' + (typeof senderId));
            comp.dataService.isFollowing(platform, senderId).then(
                function (isFollowing) {
                    console.log(
                        'Is following: ' + senderId + ' ' + isFollowing);
                    resolve(isFollowing);
                }).catch((error) => {
                console.log(
                    'Error on is following check:' + senderId + ' ' + error);
                resolve(false);
            });
        });
    }

    createFunding(platform, senderId, amount) {
        const comp = this;
        return new Promise(async (resolve) => {
            const d = {
                price: amount
            }
            axios.post('https://gateway.payburner.com/v1/gateway/paybuttons/' +
                this.fundingButtonId + '/purchase', d)
            .then((response) => {
                resolve(response.data);
            }).catch((error) => {
                resolve(error.response.data)
            });
        });
    }


    transfer(from, to, amount) {
        const self = this;
        const e = self.environment;
        const t = self.token;

        const a = amount;
        return new Promise(async (resolve, reject) => {
            console.log(
                'TRANSFER BEGIN FROM:' + from.address + ', TO:' + to.address
                + ', AMOUNT:' + amount);
            const environmentAccount = await self.getEnvironmentAccount(from);

            // -- this should succeed.
            const payload = self.transactionFactory.newTransferTransaction(
                environmentAccount.data.sequence + 1,
                environmentAccount.data.last_txn_id, e,
                t,
                from.getAddress(), to.getAddress(), a);
            const signedTransaction = from.signTokenCreateRequest(
                payload);

            try {
                const result = await axios.post(
                    'https://sidewinder.payburner.com/v1/environment/' + e
                    + '/txn',
                    signedTransaction.signedTransaction, {
                        headers: {'Content-Type': 'text/plain'}
                    });
                let data = result.data;
                console.log(
                    'TRANSFER DONE:' + from.address + ', TO:' + to.address
                    + ', AMOUNT:' + amount);

                try {
                    const metricsResult = await self.dataService.publishTransferMetrics(
                        self.environment,
                        self.token, from, to, amount);
                    console.log('metric result:' + metricsResult);
                }
                catch(e) {
                    console.log('metric failure:' + e);
                    console.log('metric failure:' + JSON.stringify(e, null, 2));
                }

                resolve(data);
            } catch (error) {
                console.log(
                    'TRANSFER ERROR:' + JSON.stringify(error.response.data,
                    null, 2));
                resolve(error.response.data);
            }
        })
    }

    async getEnvironmentAccount(api) {
        const result = await axios.get(
            'https://sidewinder.payburner.com/v1/environment/'
            + this.environment + '/address/'
            + api.getAddress() + '/sequence',
            {
                headers: {'Content-Type': 'application/json'}
            });
        let data = result.data;
        return data;
    }

    getApi(platform, id) {
        const self = this;
        if (id === this.ownerId) {
            return new Promise((resolve) => {
                console.log('Returning owner api for id:' + id);
                self.owner.isNew = false;
                resolve(self.owner);
            })
        } else {
            return this.dataService.getApi(platform, id);
        }
    }
}

module.exports.SidewinderService = SidewinderService;