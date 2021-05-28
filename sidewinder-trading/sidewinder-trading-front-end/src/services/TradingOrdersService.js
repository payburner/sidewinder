import axios from 'axios';
export default class TradingOrdersService {

    constructor(tokenService) {
        this.tokenService = tokenService;
    }

    getVenueOrders = function ( venueId ) {
        return new Promise(async (resolve) => {
            try {
                const result = await axios.get(
                    'https://trading-api.payburner.com/venues/' + venueId + '/orders',
                    {
                        headers: {'Content-Type': 'application/json'}
                    });
                let data = result.data;
                resolve(data);
            } catch (error) {
                console.log(
                    'GET ORDERS ERROR ERROR:' + JSON.stringify(error.response.data, null,
                    2) + ' ' + ('https://trading-api.payburner.com/venues/' + venueId + '/orders'));
                resolve(error.response.data);
            }
        });
    }

    placeVenueInstantOrder = function ( venueId, symbol, side, amount ) {
        const comp = this;
        return new Promise(async (resolve) => {
            try {
                const result = await axios.post(
                    'https://trading-api.payburner.com/venues/' + venueId + '/orders/instantorder',
                    {
                        exchange: venueId,
                        symbol: symbol,
                        side: side,
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
                    'PLACE INSTANT ORDER ERROR ERROR:' + JSON.stringify(error.response.data, null,
                    2) + ' ' + ('https://trading-api.payburner.com/venues/' + venueId + '/orders'));
                resolve(error.response.data);
            }
        });
    }

    placeVenueMarketOrder = function ( venueId, symbol, side, amount ) {
        const comp = this;
        return new Promise(async (resolve) => {
            try {
                const result = await axios.post(
                    'https://trading-api.payburner.com/venues/' + venueId + '/orders/marketorder',
                    {
                        exchange: venueId,
                        symbol: symbol,
                        side: side,
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
                    'PLACE INSTANT ORDER ERROR ERROR:' + JSON.stringify(error.response.data, null,
                    2) + ' ' + ('https://trading-api.payburner.com/venues/' + venueId + '/orders'));
                resolve(error.response.data);
            }
        });
    }
}