const ccxt = require ('ccxt')
class Exchanges {

    constructor( secretService, address ) {
        this.prefix = 'dev';
        this.address = address;
        this.secretService = secretService;
        this.exchanges = {};
    }

    getAddressSecrets( ) {
        const self = this;
        return new Promise((resolve, reject) => {

            self.secretService.getSecretValue({SecretId: self.prefix + '/sidewinder-trading-oms-ccxt-endpoint/' + this.address},
                (err, data) => {

                if (err) {
                    console.log(err);
                    reject('Not found.');
                } else {
                    resolve(JSON.parse(data.SecretString))
                }
            });
        });
    }

    getExchange( exchange ) {
        const self = this;
        return new Promise(async (resolve) => {
            if (typeof self.exchanges[exchange] !== 'undefined') {
                resolve(self.exchanges[exchange]);
            }
            const addressSecrets = await self.getAddressSecrets();
            if (exchange === 'bitstamp') {
                let apiUrl = 'https://www.bitstamp.net/api';
                let ccxtExchange = new ccxt.bitstamp({
                    'apiKey': addressSecrets['exchanges_' + exchange + '_apiKey'],
                    'secret': addressSecrets['exchanges_' + exchange + '_secret'],
                    'uid': addressSecrets['exchanges_' + exchange + '_uid'],
                    'enableRateLimit': true,  // this is required, as documented in the Manual!
                    urls: {
                        'api': {
                            'public': apiUrl,
                            'private': apiUrl,
                            'v1': apiUrl
                        }
                    }
                });

                ccxtExchange.supportsInstantOrderSide = function( side ) {
                    return side === 'buy';
                }

                self.exchanges[exchange] = ccxtExchange;
                resolve(ccxtExchange);
            }
            else {
                resolve(null);
            }
        });
    }


}

module.exports.Exchanges = Exchanges;