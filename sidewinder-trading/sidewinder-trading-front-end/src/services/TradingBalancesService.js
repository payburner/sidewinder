import axios from 'axios';
export default class TradingBalancesService {

    constructor() {
    }

    getVenueBalances = function ( venueId ) {
        return new Promise(async (resolve) => {
            try {
                const result = await axios.get(
                    'https://trading-api.payburner.com/venues/' + venueId + '/balances',
                    {
                        headers: {'Content-Type': 'application/json'}
                    });
                let data = result.data;
                resolve(data);
            } catch (error) {
                console.log(
                    'GET BALANCES ERROR ERROR:' + JSON.stringify(error.response.data, null,
                    2) + ' ' + ('https://trading-api.payburner.com/venues/' + venueId + '/balances'));
                resolve(error.response.data);
            }
        })

    }
}