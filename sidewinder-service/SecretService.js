const {Api} = require( "./Api");
class SecretService {

    constructor( secretService ) {
        this.prefix = 'prod';
        this.secretService = secretService;
    }

    getPlatFormAccount(platform, id) {
        const self = this;
        if (typeof id === "number") {
            id = id.toFixed(0);
        }

        return new Promise((resolve, reject) => {
            console.log('Getting Platform Account:' + platform + ' ' + id );
            self.secretService.getSecretValue({SecretId: self.prefix + '/social/' + platform + '/' + id}, function (err, data) {

                if (err) {
                    console.log('Did not get platform account:' + platform + ' ' + id + ' ' + err);
                    reject('Not found.');
                } else {
                    console.log('Get platform account:' + platform + ' ' + id  );
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
                    console.log('Did not save platform account secret:' + platform + ' ' + id );
                    console.log(err);
                    reject(err);
                }
                else {
                    console.log('Saved platform account secret:' + platform + ' ' + id );

                    let count = 0;
                    const interval = setInterval(() => {
                        count = count + 1;
                        if (count > 30) {
                           clearInterval(interval);
                           reject('saved but not found.');
                        }
                        self.secretService.getSecretValue({SecretId: self.prefix + '/social/' + platform + '/' + id}, function (err, data) {
                            if (err) {
                                console.log('// IGNORING Did not get platform account:' + platform + ' ' + id + ' ' + err);

                            } else {
                                console.log('// GOT platform account:' + platform + ' ' + id  );
                                clearInterval(interval);
                                resolve(dataBody);
                            }
                        });

                    }, 1000);
                }
            });
        });
    }

    updatePlatformAccount(platform, id, address, seed) {
        const self = this;
        return new Promise((resolve, reject) => {
            const dataBody = {
                socialplatform: platform,
                socialid: id,
                seed: seed,
                address: address
            };

            var params = {
                SecretId: self.prefix + '/social/' + platform + '/' + id,
                Description: "The platform account for " + id + " on the " + platform + " social platform",
                Name: self.prefix + '/social/' + platform + '/' + id,
                SecretString: JSON.stringify(dataBody)
            };

            self.secretService.updateSecret(params, function(err, data) {

                if (err) {
                    console.log('Did not save platform account secret:' + platform + ' ' + id );
                    console.log(err);
                    reject(err);
                }
                else {
                    console.log('Saved platform account secret:' + platform + ' ' + id );

                    let count = 0;
                    const interval = setInterval(() => {
                        count = count + 1;
                        if (count > 30) {
                            clearInterval(interval);
                            reject('saved but not found.');
                        }
                        self.secretService.getSecretValue({SecretId: self.prefix + '/social/' + platform + '/' + id}, function (err, data) {
                            if (err) {
                                console.log('// IGNORING Did not get platform account:' + platform + ' ' + id + ' ' + err);

                            } else {
                                console.log('// GOT platform account:' + platform + ' ' + id  );
                                clearInterval(interval);
                                resolve(dataBody);
                            }
                        });

                    }, 1000);
                }
            });
        });
    }

}

module.exports.SecretService = SecretService;