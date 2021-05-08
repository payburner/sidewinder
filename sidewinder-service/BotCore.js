const AWS = require('aws-sdk');

const {KeyBurner} = require("@payburner/keyburner-core/dist/npm");
class BotCore {

    decodeAndVerify(event) {
        const keyBurner = new KeyBurner();
        const decoded = keyBurner.decodeTransaction(
            JSON.parse(event.body).signedTransaction);

        if (decoded.id !== JSON.parse(event.body).id) {
            console.log('Invalid signature');
            return {status: 401, error: 'Invalid signature'};
        }
        if (!decoded.verified) {
            console.log('Was not verified...');
            return {status: 401, error: 'Could not verify.'};
        }
        return {status: 200, data: decoded};
    }

    async getConfig(address) {
        let region = "us-west-1",
            secretName = "dev/sidewinder-twitter-processor-" + address;

        let client = new AWS.SecretsManager({
            region: region
        });
        let config = null;
        try {

            config = await new Promise((resolve, reject) => {
                client.getSecretValue({SecretId: secretName},
                    function (err, data) {

                        if (err) {
                            console.log(err);
                            reject()
                        } else {
                            resolve(JSON.parse(data.SecretString))
                        }
                    });
            });
            return {
                status: 200, data: config
            }

        } catch (error) {
            return {
                status: 403,
                error: 'We could not retrieve the configuration:' + error
            }

        }
    }
}

module.exports.BotCore = BotCore;