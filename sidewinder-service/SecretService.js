const {Api} = require( "./Api");
class SecretService {

    constructor( secretService ) {
        this.prefix = 'dev';
        this.secretService = secretService;
    }


    getPlatFormAccount(platform, id) {
        const self = this;
        if (typeof id === "number") {
            id = id.toFixed(0);
        }

        return new Promise((resolve, reject) => {
            self.secretService.getSecretValue({SecretId: self.prefix + '/social/' + platform + '/' + id}, function (err, data) {

                if (err) {
                    console.log(err);
                    reject('Not found.');
                } else {
                    resolve(JSON.parse(data.SecretString))
                }
            });
        });
    }

    putPlatformAccount(platform, id, address, seed) {
        const self = this;
        return new Promise((resolve, reject) => {
            const dataBody = {
                socialplatform: platform,
                socialid: id,
                seed: seed,
                address: address
            };

            var params = {
                Description: "The platform account for " + id + " on the " + platform + " social platform",
                Name: self.prefix + '/social/' + platform + '/' + id,
                SecretString: JSON.stringify(dataBody)
            };

            self.secretService.createSecret(params, function(err, data) {
                if (err) {
                    console.log('Error Saving platform account.');
                    console.log(err);
                    reject(err);
                }
                else {
                    resolve(dataBody);
                }

            });
        });
    }

}

module.exports.SecretService = SecretService;