const {KeyBurner} = require("@payburner/keyburner-core/dist/npm");
const axios = require('axios');
const phoneNumber = require('google-libphonenumber');
class TwilioResponderClient {

    constructor(config) {
        this.config = config;
    }

    async formatId(country, id) {
        const phoneUtil = phoneNumber.PhoneNumberUtil.getInstance();
        const PNF = phoneNumber.PhoneNumberFormat;
        const number = phoneUtil.parse(id, country);
        console.log('Number:' + JSON.stringify(number, null, 2));
        const formatted = phoneUtil.format(number, PNF.E164);
        console.log('formattedNumber: ' + formatted + ', country: ' + country + ', id: ' + id);
        return {status: 200, data: formatted};
    }

    sendMessage(request) {
        const self = this;
        return new Promise((resolve) => {
            const client = new KeyBurner();
            const keypair = client.deriveKeyPair(self.config.xrpAddressSecret);
            const signed = client.signTransaction({request: request}, keypair);
            console.log('SendingSignedTransaction : ' + JSON.stringify(request));
            axios.post(
                'https://1txbkbl83d.execute-api.us-west-1.amazonaws.com/dev/process',
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
        return 'twilio';
    }
}

module.exports.TwilioResponderClient = TwilioResponderClient;