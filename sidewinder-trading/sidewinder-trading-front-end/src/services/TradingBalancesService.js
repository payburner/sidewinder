import axios from 'axios';
export default class TradingBalancesService {

    constructor( tokenService ) {
        this.tokenService = tokenService;
        const comp = this;
        this.interval = setInterval(async () => {
           const balancesResponse = await comp.getVenueBalances('bitstamp');
            comp.broadcast('bitstamp', balancesResponse.data.accounts);
        }, 5000);
        setTimeout(async () => {
            const balancesResponse = await comp.getVenueBalances('bitstamp');
            comp.broadcast('bitstamp', balancesResponse.data.accounts);
        }, 100);
        this.subscriptions = {

        }
    }

    subscribe( id, venueId, listener ) {
        this.subscriptions[id] = {
            id:id,
            venueId:venueId,listener:listener
        }
    }

    unsubscribe( id ) {
        delete this.subscriptions[id];
    }

    broadcast( venueId, accounts ) {
      Object.keys(this.subscriptions).forEach(async (id)=>{
          const sub = this.subscriptions[id];
          if (sub.venueId === venueId) {
              sub.listener( accounts );
          }
          else {
              console.log('orphan sub:' + id + ' ' + sub.venueId );
          }
      });

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