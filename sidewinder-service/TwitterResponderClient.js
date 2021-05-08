const {KeyBurner} = require("@payburner/keyburner-core/dist/npm");
const axios = require('axios');
class TwitterResponderClient {

    constructor(config, platformService) {
        this.config = config;
        this.platformService = platformService;
    }

    async formatId(country, id) {
        // if it isn't a number then it is a screen name and we need to convert it.
        if (isNaN(id)) {
            // lets fetch from the
            const botUser = await this.platformService.platformUserFromPlatformAndName('twitter', id);
            if (botUser.status === 200) {
                return {status: 200, data: botUser.data.socialid};
            }
            else {
                return {status: 404, error: 'We could not find the twitter user:' + id};
            }
        }
        else {
            return {status: 200, data: id};
        }

    }

    sendMessage(request) {
        const self = this;
        return new Promise((resolve) => {
            const client = new KeyBurner();
            const keypair = client.deriveKeyPair(self.config.xrpAddressSecret);
            const signed = client.signTransaction({request: request}, keypair);
            console.log('SendingSignedTransaction : ' + JSON.stringify(request));
            axios.post(
                'https://0eiqa95li8.execute-api.us-west-1.amazonaws.com/dev/process',
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
        return 'twitter';
    }
}

module.exports.TwitterResponderClient = TwitterResponderClient;