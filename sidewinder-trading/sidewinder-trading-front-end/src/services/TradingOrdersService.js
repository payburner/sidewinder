import axios from 'axios';
export default class TradingOrdersService {

    constructor() {
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
        })

    }
}