const {KeyBurner} = require("@payburner/keyburner-core/dist/npm");
const axios = require('axios');
class MailgunResponderClient {

    constructor(config) {
        this.config = config;
    }

    sendMessage(request) {
        const self = this;
        return new Promise((resolve) => {
            const client = new KeyBurner();
            const keypair = client.deriveKeyPair(self.config.xrpAddressSecret);
            const signed = client.signTransaction({request: request}, keypair);
            console.log('SendingSignedTransaction : ' + JSON.stringify(request));
            axios.post(
                'https://6tkawvx6x1.execute-api.us-west-1.amazonaws.com/dev/process',
                signed, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
            .then((response) => {
                console.log('SentSignedTransaction : ' + JSON.stringify(request));
                resolve(response.data);
            })
            .catch((error) => {
                console.log('FailedSignedTransaction : ' + JSON.stringify(request) + ', Error:' + JSON.stringify(error.response.data, null,2));
                resolve(error.response.data);
            });
        })
    }

    platform() {
        return 'email';
    }
}

module.exports.MailgunResponderClient = MailgunResponderClient;