const {Aqfr} = require( "@aqfr/aqfr.js" );

const {AccountUtils} = require(
    "@payburner/keyburner-sidewinder-model/dist/npm");
const AWS = require('aws-sdk');
const {Api} = require("./Api");
const {TransactionFactory, UnderlyingTransactionStatus} = require(
    "@payburner/keyburner-sidewinder-model/dist/npm");
const axios = require('axios');
const {DataService} = require("./DataService");
const {PlatformService} = require("./PlatformService");
const {DestinationTagService} = require('./DestinationTagService');

class RewardsService {

    constructor(config) {
        const docClient = new AWS.DynamoDB.DocumentClient();
        this.environment = config.environment;
        this.token = config.token;

        this.tokenDefinition = null;
        this.grantAmount = 589;
        this.transactionFactory = new TransactionFactory();
        this.ownerWallet = new Api();
        this.ownerWallet.initializeAddress( config.xrpAddressSecret );
        this.docClient = docClient;
        this.dataService = new DataService(docClient,  new AWS.SecretsManager({
            region: "us-west-1"
        }));
        this.platformService = new PlatformService(docClient, new AWS.SecretsManager({
            region: "us-west-1"
        }));
        this.destinationTagService = new DestinationTagService(docClient);
        this.ownerId = config.botName;
        this.config = config;
    }

    async init() {
        this.tokenDefinition = await this.getToken();
        if (this.tokenDefinition.status !== 200) {
            console.log('Creating Rewards token:' + this.token);
            this.tokenDefinition = await this.createToken();
            console.log('Token Create Response:' + JSON.stringify(this.tokenDefinition, null, 2));
            if (this.tokenDefinition.status !== 200) {
                throw "Could not create token";
            }
        }
        console.log('Initialized social wallet. ownerAddress: ' + this.ownerWallet.getAddress() + ', underlyingAddress:' + this.config.underlying_address);
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
                    'REWARDS TOKEN ERROR:' + JSON.stringify(error.response.data, null,
                    2) + ' ' + ('https://sidewinder.payburner.com/v1/environment/'
                    + environment + '/token/'
                    + token));
                resolve(error.response.data);
            }
        });
    }

    async createToken() {


        const self = this;
        const e = this.environment;
        const t = self.config.token;

        return new Promise(async (resolve) => {
            const environmentAccount = await self.getEnvironmentAccount(
                self.ownerWallet);


            const aqfr = new Aqfr();
            const connected = await aqfr.connectWs({ server : 'wss://s1.ripple.com/' });
            console.log('connected to aqfr: ' + JSON.stringify(connected, null, 2) + ' ' + connected);

            const senderAccountInfo = await aqfr.promiseWsAccountInfo(this.config.underlying_address);
            console.log('Sender Account Info:' + JSON.stringify(senderAccountInfo, null, 2));

            // -- this should succeed.
            const payload = self.transactionFactory.newCreateTokenTransaction(
                environmentAccount.data.sequence + 1,
                environmentAccount.data.last_txn_id, e,
                t,
                0, 6, true, false, false);
            payload.underlying_currency = self.config.underlying_currency;
            payload.underlying_address =  self.config.underlying_address;
            payload.offramp_fee_multiplier = self.config.underlying_off_ramp_fee_multiplier;
            payload.onramp_fee_multiplier = self.config.underlying_on_ramp_fee_multiplier
            payload.underlying_currency_multiplier = self.config.underlying_currency_multiplier;
            payload.initial_amount = parseInt((senderAccountInfo.result.account_data.Balance * self.config.underlying_currency_multiplier).toString());

            const signedTransaction = self.ownerWallet.signTokenCreateRequest(
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

    transferUnitAmount(platform, id, unitAmount) {
        const rawAmount = parseInt( AccountUtils.calculateRaw(unitAmount.toString(), 6) );
        return this.transferRawAmount(platform, id, rawAmount);
    }

    transferRawAmount(platform, id, rawAmount) {
        const self = this;
        const environment = self.environment;
        const token = self.token;
        if (typeof rawAmount === 'string') {
            rawAmount= parseInt(rawAmount);
        }

        return new Promise(async (resolve, reject) => {
            const destinationWallet = await self.getApi(platform, id);
            const environmentAccount = await self.getEnvironmentAccount(
                self.ownerWallet);

            // -- this should succeed.
            const payload = self.transactionFactory.newTransferTransaction(
                environmentAccount.data.sequence + 1,
                environmentAccount.data.last_txn_id, environment,
                token,
                self.ownerWallet.getAddress(), destinationWallet.getAddress(), rawAmount);
            console.log('TransferRawAmount.  payload:' + JSON.stringify(payload, null, 2));
            const signedTransaction = self.ownerWallet.signTokenCreateRequest(
                payload);

            try {
                const result = await axios.post(
                    'https://sidewinder.payburner.com/v1/environment/'
                    + environment + '/txn',
                    signedTransaction.signedTransaction, {
                        headers: {'Content-Type': 'text/plain'}
                    });
                let data = result.data;
                console.log('TransferRawAmount.  result:' + JSON.stringify(data, null, 2));
                resolve(data);
            } catch (error) {
                console.log(JSON.stringify(error.response.data, null, 2));
                resolve(error.response.data);
            }
        })
    }


    transferUserToUser(platform, from, to, amount) {
        const self = this;
        const e = self.environment;
        const t = self.token;
        if (typeof amount !== 'string') {
            amount = amount.toString();
        }
        const a = parseInt(AccountUtils.calculateRaw( amount, 6));

        let targetPlatform = platform;
        if (typeof to.platform !== 'undefined') {
            targetPlatform = to.platform;
            console.log('To platform is specified:' + targetPlatform);
        }

        return new Promise(async (resolve, reject) => {
            console.log(
                'TRANSFER BEGIN FROM:' + from.id + ', TO:' + to.id
                + ', AMOUNT:' + amount + ', ' + a );

            const fromWallet = await self.getApi(platform, from.id);
            const environmentAccount = await self.getEnvironmentAccount(fromWallet);
            const toWallet = await self.getApi(targetPlatform, to.id);

            // -- this should succeed.
            const payload = self.transactionFactory.newTransferTransaction(
                environmentAccount.data.sequence + 1,
                environmentAccount.data.last_txn_id, e,
                t,
                fromWallet.getAddress(), toWallet.getAddress(), a);
            const signedTransaction = fromWallet.signTokenCreateRequest(
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
                    'TRANSFER DONE:' + from.id + ', TO:' + to.id
                    + ', AMOUNT:' + amount);

                /**
                 * @TODO Metrics
                 */

                if (data.processing_stage !== 'PROCESSED') {
                    resolve({status: 500,  error: 'The transaction to transfer the funds timed out. Please try again.'});
                    return;
                }
                if (data.status !== 200 || !data.verified) {
                    if (typeof data.error !== 'undefined') {
                        resolve( {status: data.status,  error: 'The transaction to transfer the funds failed with the error:\n\n ' + data.error  + '.\n\n  Please verify you have sufficient XRP balance to cover the transfer.'} );
                        return;
                    }
                    else {
                        resolve({status: data.status,  error:  'The transaction to transfer the funds failed.'});
                        return;
                    }
                }
                resolve({status: 200, data: amount + ' of XRP was transferred to ' + to.id});
            } catch (error) {
                console.log(
                    'TRANSFER ERROR:' + JSON.stringify(error.response.data,
                    null, 2));
                resolve(error.response.data);
            }
        })
    }



    fund(platform, id) {
         return this.transferRawAmount(platform, id, this.grantAmount);
    }

    getAccount(platform, id) {
        const comp = this;
        return new Promise((resolve, reject) => {
            console.log('Getting Rewards Token Account:' + id);
            comp.getApi(platform, id).then(
                (e) => {
                    console.log(
                        'Got Rewards Account Api:' + JSON.stringify(e, null, 2));
                    if (e.isNew) {
                        console.log('!Funding Rewards Account:' + id);
                        comp.fund(platform,
                            id).then(
                            (funding) => {
                                console.log('Got Rewards Funding: ' + id + ' ' + JSON.stringify(funding, null, 2));
                                comp.getTokenAccount(
                                    e).then(async (account) => {
                                    console.log(
                                        'Got XRP Token Account IsNew:'
                                        + id);
                                    const tagResponse = await comp.getDestinationTag(e.getAddress(), platform, id, comp.config.address);
                                    if (tagResponse.status === 200) {
                                        account['destination_tag'] = tagResponse.data.destination_tag;
                                    }
                                    else {
                                        reject(tagResponse);
                                        return
                                    }
                                    resolve({
                                        senderId: id,
                                        api: e,
                                        account: account,
                                        isNew: true
                                    });
                                    return;
                                })
                            });
                    } else {
                        comp.getTokenAccount(
                            e).then(async(account) => {
                            console.log('!!!Got Rewards Token Account Is Not New:'
                                + id + ' ' + JSON.stringify(account) + ' ' + typeof account.status + ' ' + (account.status === 404));
                            if (typeof account.status !== 'undefined' && account.status === 404) {
                                console.log('!Beginning Rewards to fund!:' + id);
                                comp.fund(platform,
                                    id).then(
                                    (funding) => {
                                        console.log('Got Funding: ' + id + ' ' + JSON.stringify(funding, null, 2));
                                        comp.getTokenAccount(
                                            e).then(async (account) => {
                                            console.log(
                                                'Got Rewards Token Account IsNew:'
                                                + id);
                                            const tagResponse = await comp.getDestinationTag(e.getAddress(), platform, id, comp.config.address);
                                            if (tagResponse.status === 200) {
                                                account['destination_tag'] = tagResponse.data.destination_tag;
                                            }
                                            else {
                                                reject(tagResponse);
                                            }
                                            resolve({
                                                senderId: id,
                                                api: e,
                                                account: account,
                                                isNew: true
                                            });
                                        })
                                    });
                            }
                            else {
                                console.log('Returning Rewards already funded!');
                                const tagResponse = await comp.getDestinationTag(e.getAddress(), platform, id, comp.config.address);
                                if (tagResponse.status === 200) {
                                    account['destination_tag'] = tagResponse.data.destination_tag;
                                }
                                else {
                                    reject(tagResponse);
                                }
                                resolve({
                                    senderId: id,
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

    getSocialUserByInternalAddress( internal_address ) {
        return this.platformService.getSocialUserByInternalAddress(internal_address);
    }

    getUserMetrics(api) {
        return this.dataService.getUserMetrics(this.environment, this.token, api);
    }

    getTokenMetrics() {
        return this.dataService.getTokenMetrics(this.environment, this.token );
    }

    getDestinationTag(address, platform, id, botXrpAddress) {
        const self = this;
        return new Promise(async (resolve, relect) => {
            const environment = self.environment;
            const token = self.token;

            const accountId = 'https://sidewinder.payburner.com/v1/environment/'
                + environment + '/token/'
                + token + '/address/' + address;
            try {
                let tagResponse = await self.destinationTagService.getDestinationTagByAccountId(accountId);
                console.log('TagResponse on Get:' + JSON.stringify(tagResponse, null, 2));
                if (tagResponse.status == 200) {
                    resolve(tagResponse);
                    return;
                }
                else {
                    tagResponse = await self.setDestinationTag(address, platform, id, botXrpAddress);
                    console.log('TagResponse on Set:' + JSON.stringify(tagResponse, null, 2));

                    if (tagResponse.status == 200) {
                        resolve(tagResponse);
                        return;
                    }
                }
                console.log('TagResponse on Fail:' + JSON.stringify(tagResponse, null, 2));

                resolve(tagResponse)
            } catch (error) {
                console.log('Error on Get destination tag:' +JSON.stringify(error, null, 2));
                resolve({status:500,error:error});
            }
        });
    }

    getRandomTag() {
        return Math.floor(Math.random() * Math.floor(1000000000)).toString();
    }

    setDestinationTag(address, platform, senderScreenName, botXrpAddress) {
        const self = this;
        return new Promise(async (resolve, relect) => {
            const environment = self.environment;
            const token = self.token;

            const accountId = 'https://sidewinder.payburner.com/v1/environment/'
                + environment + '/token/'
                + token + '/address/' + address;
            const tokenId = 'https://sidewinder.payburner.com/v1/environment/'
                + environment + '/token/'
                + token;

            try {
                let tag = this.getRandomTag();
                let wroteTag = await self.destinationTagService.setDestinationTag(accountId, tokenId, self.config.underlying_address, tag, platform, senderScreenName, botXrpAddress);
                let count = 0;
                while(!wroteTag && count < 100) {
                    try {
                        count++;
                        console.log('Setting destination tag:' + count);
                        tag = this.getRandomTag();
                        wroteTag = await self.destinationTagService.setDestinationTag(accountId, tokenId, self.config.underlying_address, tag, platform, senderScreenName, botXrpAddress);
                    } catch (error) {
                        console.log('error creating destination tag:' + JSON.stringify(error, null, 2));
                    }
                }
                resolve({status:200, data: {destination_tag:tag}});
            } catch (error) {
                console.log('Error on Get destination tag:' +JSON.stringify(error, null, 2));
                resolve({status:500,error:error});
            }
        });
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



    redeem(platform, screenName, requestedAmount, address, tag) {
        const comp = this;
        return new Promise(async (resolve) => {

            const senderRewardsAccount = await comp.getAccount(platform,
                screenName );

            // minimum is 0.0001
            // maximum is 10.0000
            const amount = parseInt(AccountUtils.calculateRaw(
                requestedAmount,
                6));
            const minimum = parseInt(AccountUtils.calculateRaw(
                "0.0001",
                6));
            const maximum = parseInt(AccountUtils.calculateRaw(
                "10.000",
                6));
            if (amount < minimum) {
                resolve(
                    'The amount you requested to redeem is less than our minimum of 0.0001 XRP');
                return;
            }
            if (amount > maximum) {
                resolve('The amount you requested to withdraw is greater than our maximum of 10 XRP');
                return;
            }
            if (amount > senderRewardsAccount.account.data.available_balance) {
                resolve('The amount you requested to withdraw is greater than your balance of ' + AccountUtils.calculateUnit(
                    senderRewardsAccount.account.data.available_balance.toFixed(),
                    6));
                return;
            }

            const aqfr = new Aqfr();
            const connected = await aqfr.connectWs({ server : 'wss://s1.ripple.com/' });
            console.log('connected to aqfr: ' + JSON.stringify(connected, null, 2) + ' ' + connected);

            await aqfr.initAccount({ xrpAddress: comp.config.underlying_address, secret: comp.config.underlying_address_secret });


            if (!aqfr.isValidXrpAddress(address)) {
                resolve('Please supply a valid xrp address to which we can send your XRP.');
                return;
            }

            const senderAccountInfo = await aqfr.promiseWsAccountInfo(comp.config.underlying_address);
            console.log('Sender Account Info:' + JSON.stringify(senderAccountInfo, null, 2));

            const accountInfo = await aqfr.promiseWsAccountInfo(address);

            // if there is not an error, this means the address is already used and
            // hence we need to return an error.
            if (typeof accountInfo.error !== 'undefined') {
                resolve('Please supply an initialized xrp address to which we can send your XRP.');
                return;
            }

            if (typeof tag === 'undefined' || tag === null) {
                console.log('Straight Pay: ' + tag + ' ' + amount.toString() + ' ' + address);
                // now let's send the
                aqfr.signStraightPay(address, amount.toString()).then(async function(signedStraightPay) {
                    console.log('SIGNED PAY SUCCESS:' + JSON.stringify(signedStraightPay, null, 2));

                    const underlying_txn_id = signedStraightPay.id;
                    const offRampPendingResponse = await comp.offRampPending(platform, screenName, requestedAmount, address, underlying_txn_id);
                    if (offRampPendingResponse.status !== 200) {
                        resolve(offRampPendingResponse.message);
                        return;
                    }

                    aqfr.submitSignedTransactionNoWait(signedStraightPay.signedTransaction).then((paySuccess) => {
                        console.log('Submit Success:' + JSON.stringify(paySuccess, null, 2));
                        if (paySuccess.engine_result.startsWith('tes') || paySuccess.engine_result.startsWith('ter')) {
                            resolve('The withdrawal order has been sent to the XRPL.  I will notify you when the withdrawal has settled.');
                        }
                        else {
                            resolve('The withdrawal order was not accepted by the XRPL.  Please try against later.  Engine code: ' + paySuccess.engine_result);
                        }
                        return;
                    }).catch(async (error) => {
                        console.log('ERROR ON XRPL:' + error);
                        console.log('ERROR ON XRPL:' + JSON.stringify(error, null, 2));
                        resolve( await comp.offRampResult(platform, screenName, underlying_txn_id, UnderlyingTransactionStatus.FAILED, error));
                        return;
                    });
                });
            }
            else {// now let's send the
                // @TODO -- ensure max length of tag so that it doesn't blow up in the xrpl
                console.log('@@Straight Pay with Tag: ' + tag + ' ' + amount.toString() + ' ' + address);
                // now let's send the
                aqfr.signStraightPayWithTag(address, parseInt(tag), amount.toString()).then(async function(signedStraightPay) {
                    console.log('SIGNED PAY SUCCESS:' + JSON.stringify(signedStraightPay, null, 2));

                    const underlying_txn_id = signedStraightPay.id;
                    const offRampPendingResponse = await comp.offRampPending(platform, screenName, requestedAmount, address, underlying_txn_id);
                    if (offRampPendingResponse.status !== 200) {
                        resolve(offRampPendingResponse.message);
                        return;
                    }

                    aqfr.submitSignedTransactionNoWait(signedStraightPay.signedTransaction).then((paySuccess) => {
                        console.log('Submit Success:' + JSON.stringify(paySuccess, null, 2));
                        if (paySuccess.engine_result.startsWith('tes') || paySuccess.engine_result.startsWith('ter')) {
                            resolve('The withdrawal order has been sent to the XRPL.  I will notify you when the withdrawal has settled.  The transaction has is ' + underlying_txn_id);
                        }
                        else {
                            resolve('The withdrawal order was not accepted by the XRPL.  Please try against later.  Engine code: ' + paySuccess.engine_result);
                        }
                        return;
                    }).catch(async (error) => {
                        console.log('ERROR ON XRPL:' + error);
                        console.log('ERROR ON XRPL:' + JSON.stringify(error, null, 2));
                        resolve( await comp.offRampResult(platform, screenName, underlying_txn_id, UnderlyingTransactionStatus.FAILED, error));
                        return;
                    });
                });
            }
        })
    }

    reward(platform, toscreenname, amount) {
        const self = this;
        const environment = self.environment;
        const token = self.token;

        const a = AccountUtils.calculateRaw(amount.toFixed(6),6) ;
        console.log()
        return new Promise(async (resolve, reject) => {
            const d = await self.getApi(platform, toscreenname);
            const environmentAccount = await self.getEnvironmentAccount(
                self.ownerWallet);

            // -- this should succeed.
            const payload = self.transactionFactory.newTransferTransaction(
                environmentAccount.data.sequence + 1,
                environmentAccount.data.last_txn_id, environment,
                token,
                self.ownerWallet.getAddress(), d.getAddress(), parseInt(a));
            const signedTransaction = self.ownerWallet.signTokenCreateRequest(
                payload);

            resolve(await self.sidewinderTransact(environment, signedTransaction.signedTransaction));
        })
    }

    onRamp(social_platform, social_id, amount, underlying_source_address, underlying_txn_id) {
        const self = this;
        const environment = self.environment;
        const token = self.token;
        if (typeof amount === 'string') {
            amount = parseInt(amount);
        };

        return new Promise(async (resolve, reject) => {
            const d = await self.getApi(social_platform, social_id);
            const environmentAccount = await self.getEnvironmentAccount(
                self.ownerWallet);

            // -- this should succeed.
            const payload = self.transactionFactory.newOnRampTransaction(
                environmentAccount.data.sequence + 1,
                environmentAccount.data.last_txn_id, environment,
                token,
                d.getAddress(), amount, underlying_source_address, underlying_txn_id);


            console.log('OnRamp Payload:' + JSON.stringify(payload, null, 2));

            const signedTransaction = self.ownerWallet.signTokenCreateRequest(
                payload);

            resolve(await self.sidewinderTransact(environment, signedTransaction.signedTransaction));
        })
    }

    onRampToOwner( amount, underlying_source_address, underlying_txn_id) {
        const self = this;
        const environment = self.environment;
        const token = self.token;
        if (typeof amount === 'string') {
            amount = parseInt(amount);
        };

        return new Promise(async (resolve, reject) => {
            const api = await self.ownerWallet;
            const environmentAccount = await self.getEnvironmentAccount(
                self.ownerWallet);

            // -- this should succeed.
            const payload = self.transactionFactory.newOnRampTransaction(
                environmentAccount.data.sequence + 1,
                environmentAccount.data.last_txn_id, environment,
                token,
                api.getAddress(), amount, underlying_source_address, underlying_txn_id);


            console.log('OnRampToOwnerPayload : ' + JSON.stringify(payload, null, 2));

            const signedTransaction = self.ownerWallet.signTokenCreateRequest(
                payload);

            resolve(await self.sidewinderTransact(environment, signedTransaction.signedTransaction));
        })
    }

    sendBack(platform, toscreenname, amount) {
        const self = this;
        const environment = self.environment;
        const token = self.token;

        const a = parseInt(AccountUtils.calculateRaw(
            amount,
            6));

        return new Promise(async (resolve, reject) => {
            const d = await self.getApi(platform, toscreenname);
            console.log('redeemer:' + platform + ' ' + toscreenname + ' ' + d.getAddress() + ' '+ self.ownerWallet.getAddress());

            const redeemerEnvironmentAccount = await self.getEnvironmentAccount(
                d);

            // -- this should succeed.
            const payload = self.transactionFactory.newTransferTransaction(
                redeemerEnvironmentAccount.data.sequence + 1,
                redeemerEnvironmentAccount.data.last_txn_id, environment,
                token,
                d.getAddress(), self.ownerWallet.getAddress(), a);
            const signedTransaction = d.signTokenCreateRequest(
                payload);

            resolve(await self.sidewinderTransact(environment, signedTransaction.signedTransaction));
        })
    }

    sidewinderTransact( environment, signedTransaction ) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await axios.post(
                    'https://sidewinder.payburner.com/v1/environment/'
                    + environment + '/txn',
                    signedTransaction, {
                        headers: {'Content-Type': 'text/plain'}
                    });
                let data = result.data;
                console.log('SEND BACK DATA:' + data );
                console.log('SEND BACK DATA2:' + JSON.stringify(data, null, 2) );

                resolve(data);
            } catch (error) {
                console.log('SEND BACK ERROR:' +JSON.stringify(error.response.data, null, 2));
                console.log('SEND BACK ERROR2:' + error.response.data );
                resolve(error.response.data);
            }
        });
    }

    offRampPending(platform, social_id, amount, underlying_destination_address, underlying_txn_id) {
        const self = this;
        const environment = self.environment;
        const token = self.token;

        const a = parseInt(AccountUtils.calculateRaw(
            amount,
            6));

        return new Promise(async (resolve, reject) => {
            const transactorApi = await self.getApi(platform, social_id);
            console.log('offramp pending:' + platform + ' ' + social_id + ' ' + transactorApi.getAddress() + ' '+ self.ownerWallet.getAddress() + ' ' + underlying_txn_id);

            const transactorEnvironmentAccount = await self.getEnvironmentAccount(
                transactorApi);
            // -- this should succeed.
            const payload = self.transactionFactory.newOffRampRequestTransaction(
                transactorEnvironmentAccount.data.sequence + 1,
                transactorEnvironmentAccount.data.last_txn_id, environment,
                token,
                transactorApi.getAddress(), a, underlying_destination_address, underlying_txn_id);
            console.log('Off ramp Request Payload:' + JSON.stringify(payload, null, 2));
            const signedTransaction = transactorApi.signTokenCreateRequest(
                payload);

            const offRampPending = await self.sidewinderTransact(environment, signedTransaction.signedTransaction);
            if (offRampPending.processing_stage !== 'PROCESSED') {
                resolve({status:500, message:'The transaction to register the pending underlying transaction timed out. Please try again.'});
                return;
            }
            if (offRampPending.status !== 200 || !offRampPending.verified) {
                if (typeof offRampPending.error !== 'undefined') {
                    resolve({status:offRampPending.status, message:'The transaction to register the pending underlying transaction failed with the error:\n\n ' + offRampPending.error  + '.\n\n  Please verify you have sufficient balance to cover the withdrawal.'});
                    return;
                }
                else {
                    resolve({status:offRampPending.status, message:'The transaction to register the pending underlying transaction failed.'});
                    return;
                }
            }
            resolve({status:200});
        })
    }

    failOffRampResultByIssuer(underlying_txn_id) {
        return this.offRampResultByIssuer(underlying_txn_id, UnderlyingTransactionStatus.FAILED);
    }

    completeOffRampResultByIssuer(underlying_txn_id) {
        return this.offRampResultByIssuer(underlying_txn_id, UnderlyingTransactionStatus.COMPLETED);
    }

    offRampResultByIssuer(underlying_txn_id, status) {
        const self = this;
        const environment = self.environment;
        const token = self.token;

        return new Promise(async (resolve, reject) => {
            const d = await self.getApi(self.botName);

            const redeemerEnvironmentAccount = await self.getEnvironmentAccount(
                d);

            const payload = self.transactionFactory.newOffRampResultTransaction(
                redeemerEnvironmentAccount.data.sequence + 1,
                redeemerEnvironmentAccount.data.last_txn_id, environment,
                token, underlying_txn_id, status);

            console.log('OffRamp Result Payload:' + JSON.stringify(payload, null, 2));
            const signedTransaction = d.signTokenCreateRequest(
                payload);

            const offRampSettleResponse = await self.sidewinderTransact(environment, signedTransaction.signedTransaction);
            if (offRampSettleResponse.processing_stage !== 'PROCESSED') {
                resolve({status: 400,
                    message: 'The transaction to register the completed underlying transaction timed out. Please try again.'});
                return;
            }
            if (offRampSettleResponse.status !== 200 || !offRampSettleResponse.verified) {
                if (typeof offRampSettleResponse.error !== 'undefined') {
                    resolve({status: 400,
                        message: 'The transaction to register the completed underlying transaction failed with the error:\n\n ' + offRampSettleResponse.error  + '.\n\n  Please verify you have sufficient balance to cover the withdrawal.'});
                    return;
                }
                else {
                    resolve({status: 400,
                        message: 'The transaction to register the completed underlying transaction failed.'});
                    return;
                }
            }

            resolve({status: 200, data: {status:status}});
        })
    }

    offRampResult(platform, toscreenname, underlying_txn_id, status, error) {
        const self = this;
        const environment = self.environment;
        const token = self.token;

        return new Promise(async (resolve, reject) => {
            const d = await self.getApi(platform, toscreenname);
            console.log('offramp result:' + platform + ' ' + toscreenname + ' ' + d.getAddress() + ' '+ self.ownerWallet.getAddress() + ' ' + underlying_txn_id + ' ' + status + ' ' + (typeof status));

            const redeemerEnvironmentAccount = await self.getEnvironmentAccount(
                d);

            const payload = self.transactionFactory.newOffRampResultTransaction(
                redeemerEnvironmentAccount.data.sequence + 1,
                redeemerEnvironmentAccount.data.last_txn_id, environment,
                token, underlying_txn_id, status);

            console.log('OffRamp Result Payload:' + JSON.stringify(payload, null, 2));
            const signedTransaction = d.signTokenCreateRequest(
                payload);

            const sendBackResponse = await self.sidewinderTransact(environment, signedTransaction.signedTransaction);
            if (sendBackResponse.processing_stage !== 'PROCESSED') {
                resolve('The transaction to register the completed underlying transaction timed out. Please try again.');
                return;
            }
            if (sendBackResponse.status !== 200 || !sendBackResponse.verified) {
                if (typeof sendBackResponse.error !== 'undefined') {
                    resolve('The transaction to register the completed underlying transaction failed with the error:\n\n ' + sendBackResponse.error  + '.\n\n  Please verify you have sufficient balance to cover the redemption.');
                    return;
                }
                else {
                    resolve('The transaction to register the completed underlying transaction failed.');
                    return;
                }
            }

            resolve('The transaction on the XRPL failed with the error: ' + JSON.stringify( error ));
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
                self.ownerWallet.isNew = false;
                resolve(self.ownerWallet);
            })
        } else {
            return this.platformService.getApi(platform, id);
        }

    }
}

module.exports.RewardsService = RewardsService;