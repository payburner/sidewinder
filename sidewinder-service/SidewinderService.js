const {Api} = require( "./Api" );
const {TransactionFactory} = require( "@payburner/keyburner-sidewinder-model/dist/npm/transactions/TransactionFactory" );
const axios = require( 'axios' );
const {DataService}  = require( "./DataService" );
class SidewinderService {

    constructor( secret, docClient, secretManager ) {
        this.environment = 'Payburner';
        this.token = 'JIMMYJAY';
        this.initialAmount = 10000000000000000000;
        this.grantAmount = 100000000;
        this.tokenDefinition = null;
        this.transactionFactory = new TransactionFactory();
        this.owner = new Api();
        this.owner.initializeAddress(secret);
        this.dataService = new DataService(docClient, secretManager);
        this.ownerId = 'PayburnerBot';
    }

    async init() {
        this.tokenDefinition = await this.getToken();
        if (this.tokenDefinition.status !== 200) {
            console.log('Creating token:');
            this.tokenDefinition = await this.createToken();
            if (this.tokenDefinition.status !== 200) {
                throw "Could not create token";
            }
        }
    }

    getToken() {
        const self = this;
        return new Promise(async (resolve, relect) => {
            const e =self.environment;

            const t = self.token;
            try {
                const {data: result} = await axios.get(
                    'https://sidewinder.payburner.com/v1/environment/' + e + '/token/'
                    + t,
                    {
                        headers: {'Content-Type': 'application/json'}
                    });
                resolve(result);
            } catch (error) {
                console.log('TOKEN ERROR:' + JSON.stringify(error.response.data, null, 2));
                resolve( error.response.data );
            }
        });
    }

    getTokenAccount( api ) {
        const self = this;
        return new Promise(async (resolve, relect) => {
            const e =self.environment;
            const t = self.token;
            const a = api.getAddress();
            try {
                const {data: result} = await axios.get(
                    'https://sidewinder.payburner.com/v1/environment/' + e + '/token/'
                    + t + '/address/' + a,
                    {
                        headers: {'Content-Type': 'application/json'}
                    });
                resolve(result);
            } catch (error) {
                console.log(JSON.stringify(error.response.data, null, 2));
                resolve(error.response.data);
            }
        });
    }

    createToken() {
        const self = this;
        const e = this.environment;
        const t = this.token;
        const i = this.initialAmount;
        return new Promise( async(resolve) => {
            const environmentAccount = await self.getEnvironmentAccount(self.owner);
            console.log('ENV ACCOUNT::' + JSON.stringify(environmentAccount, null, 2));

            // -- this should succeed.
            const payload = self.transactionFactory.newCreateTokenTransaction(
                environmentAccount.data.sequence+1, environmentAccount.data.last_txn_id, e,
                t,
                10, 6, true, false, false);
            payload.initial_amount = i

            console.log('INITIALIZING TOKEN:' + JSON.stringify(payload, null, 2));
            const signedTransaction = self.owner.signTokenCreateRequest(
                payload);

            try {
                const {data: result} = await axios.post(
                    'https://sidewinder.payburner.com/v1/environment/' + e + '/txn',
                    signedTransaction.signedTransaction, {
                        headers: {'Content-Type': 'text/plain'}
                    });
                resolve(result);
            } catch (error) {
                resolve(error.response.data);

            }
        });

    }

    fund(platform, toscreenname) {
        const self = this;
        const e = self.environment;
        const t = self.token;

        const a = this.grantAmount;
        return new Promise(async (resolve, reject) => {
            const d = await self.getApi(platform, toscreenname);
            const environmentAccount = await self.getEnvironmentAccount(self.owner);

            // -- this should succeed.
            const payload = self.transactionFactory.newTransferTransaction(environmentAccount.data.sequence+1,
                environmentAccount.data.last_txn_id, e,
                t,
                self.owner.getAddress(), d.getAddress(), a );
            console.log('FUNDING REQUEST:' + JSON.stringify(payload, null, 2));
            const signedTransaction = self.owner.signTokenCreateRequest(
                payload);

            try {
                const {data: result} = await axios.post(
                    'https://sidewinder.payburner.com/v1/environment/' + e + '/txn',
                    signedTransaction.signedTransaction, {
                        headers: {'Content-Type': 'text/plain'}
                    });
                console.log('FUNDING RESULT:' + JSON.stringify(result));
                resolve(result);
            } catch (error) {
                console.log(JSON.stringify(error.response.data, null, 2));
                resolve(error.response.data);
            }
        })
    }

    isFollowing(platform, senderId) {
        const comp = this;
        return new Promise((resolve) => {
            console.log('Check new follow for ' + senderId );
            console.log('Type of follow ' + (typeof senderId));
            comp.dataService.isFollowing(platform, senderId).then(
                function (isFollowing) {
                    console.log(
                        'Is following: ' + senderId + ' ' + isFollowing);
                    resolve(isFollowing);
                }).catch((error) => {
                    console.log('Error on is following check:' + senderId + ' ' + error);
                    resolve(false);
            });
        });
    }

    transfer( from, to, amount ) {
        const self = this;
        const e = self.environment;
        const t = self.token;

        const a = amount;
        return new Promise(async (resolve, reject) => {

            const environmentAccount = await self.getEnvironmentAccount(from);

            // -- this should succeed.
            const payload = self.transactionFactory.newTransferTransaction(environmentAccount.data.sequence+1,
                environmentAccount.data.last_txn_id, e,
                t,
                from.getAddress(), to.getAddress(), a );
            console.log('XFER REQUEST:' + JSON.stringify(payload, null, 2));
            const signedTransaction = from.signTokenCreateRequest(
                payload);

            try {
                const {data: result} = await axios.post(
                    'https://sidewinder.payburner.com/v1/environment/' + e + '/txn',
                    signedTransaction.signedTransaction, {
                        headers: {'Content-Type': 'text/plain'}
                    });
                console.log('XFER RESULT:' + JSON.stringify(result));
                resolve(result);
            } catch (error) {
                console.log(JSON.stringify(error.response.data, null, 2));
                resolve(error.response.data);
            }
        })
    }

    async getEnvironmentAccount(api) {
        const {data: result} = await axios.get(
            'https://sidewinder.payburner.com/v1/environment/' + this.environment + '/address/'
            + api.getAddress() + '/sequence',
            {
                headers: {'Content-Type': 'application/json'}
            });
        return result;
    }

    getApi( platform, id ) {
        const self = this;
        if (id === this.ownerId) {
            return new Promise((resolve) => {
                console.log('Returning owner api for id:' + id);
                self.owner.isNew = false;
                resolve(self.owner);
            })
        }
        else {
            return this.dataService.getApi(platform, id);
        }

    }
}

module.exports.SidewinderService = SidewinderService;