import axios from 'axios';
export default class Level2Service {

    constructor(tokenService, tradingMetaDataService) {
        this.tokenService = tokenService;
        this.tradingMetaDataService = tradingMetaDataService;
    }

    sweepOut = function ( venueId, sourceCurrency, targetCurrencies, amount ) {
        const comp = this;
        return new Promise(async (resolve) => {
            try {
                const result = await axios.post(
                    'https://trading-api.payburner.com/venues/' + venueId + '/level2/sweepout',
                    {
                        exchange: venueId,
                        source_currency: sourceCurrency,
                        target_currencies: targetCurrencies,
                        amount: amount
                    },
                    {
                        headers: {
                            'Authorization' : 'Bearer ' + comp.tokenService.getToken(),
                            'Content-Type': 'application/json'}
                    });
                let data = result.data;
                resolve(data);
            } catch (error) {
                console.log(
                    'Sweep Out ERROR ERROR:' + JSON.stringify(error.response.data, null,
                    2) + ' ' + ('https://trading-api.payburner.com/venues/' + venueId + '/orders'));
                resolve(error.response.data);
            }
        });
    }

    sweepIn = function ( venueId, sourceCurrencies, targetCurrency, amount ) {
        const comp = this;
        return new Promise(async (resolve) => {
            try {
                const result = await axios.post(
                    'https://trading-api.payburner.com/venues/' + venueId + '/level2/sweepin',
                    {
                        exchange: venueId,
                        source_currencies: sourceCurrencies,
                        target_currency: targetCurrency,
                        amount: amount
                    },
                    {
                        headers: {
                            'Authorization' : 'Bearer ' + comp.tokenService.getToken(),
                            'Content-Type': 'application/json'}
                    });
                let data = result.data;
                resolve(data);
            } catch (error) {
                console.log(
                    'Sweep In ERROR ERROR:' + JSON.stringify(error.response.data, null,
                    2) + ' ' + ('https://trading-api.payburner.com/venues/' + venueId + '/orders'));
                resolve(error.response.data);
            }
        });
    }


}