const {KeyBurner} = require("@payburner/keyburner-core/dist/npm");
const axios = require('axios');
class RemoteWalletClient {

    constructor(config) {
        this.config = config;
    }

    transferUnitAmount(platform, user, unit_amount) {
        const self = this;
        return new Promise((resolve) => {
            const client = new KeyBurner();
            const keypair = client.deriveKeyPair(self.config.xrpAddressSecret);

            const event = {
               event_type: 'command',
               command_flavor: 'transfer_unit_amount',
               platform: platform,
               users: {
                   destination: user
               },
                payload: {
                   unit_amount: unit_amount
                }
            };
            console.log('Event Payload:' + JSON.stringify(event, null, 2));

            const signed = client.signTransaction(event, keypair);

            axios.post(
                'https://xkq0rvyt83.execute-api.us-west-1.amazonaws.com/dev/process',
                signed, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
            .then((response) => {
                console.log('Response : ' + JSON.stringify(response.data, null, 2));

                if (typeof response.data.transaction !== 'undefined') {
                   if (response.data.transaction.status !== 200) {
                       resolve({
                           status: response.data.transaction.status, error: {
                              error_code: response.data.transaction.error_code,
                              error: response.data.transaction.error
                           }
                       });
                       return;
                   }
                   else {
                       resolve({
                           status: response.data.transaction.status, data: {
                               destination_wallet: response.data.destination_wallet,
                               internal_txn_id: response.data.transaction.id
                           }
                       });
                       return;
                   }
                }
                else {
                    resolve({
                        status: 500, error: {
                            error_code: -1,
                            error: 'We did not get a transaction response from the remote wallet'
                        }
                    });
                }

                resolve(response.data);
            })
            .catch((error) => {
                console.log('FailedSignedTransaction : ' + JSON.stringify(event) + ', Error:' + JSON.stringify(error.response.data, null,2));
                resolve({
                    status: 500, error: {
                        error_code: -1,
                        error: JSON.stringify(error.response.data, null,2)
                    }
                });
            });
        })
    }
}

module.exports.RemoteWalletClient = RemoteWalletClient;