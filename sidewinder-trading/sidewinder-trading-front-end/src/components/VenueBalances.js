import React from 'react';
import VenueBalance from "./VenueBalance";
export default class VenueBalances extends React.Component {
    constructor(props) {
        super(props);
        this.pollingInterval = null;
        this.state = { balances: [] }
    }

    componentDidMount() {
        const comp = this;
        this.pollingInterval = setInterval(async () => {
            const balancesResponse = await comp.props.coreTradingService.tradingBalancesService().getVenueBalances('bitstamp');
            //console.log('Balances:' + JSON.stringify(balancesResponse, null, 2));
            comp.setState({balances: balancesResponse.data.accounts })
        }, 5000);
        setTimeout(async () => {
            const balancesResponse = await comp.props.coreTradingService.tradingBalancesService().getVenueBalances('bitstamp');
            //console.log('Balances:' + JSON.stringify(balancesResponse, null, 2));
            comp.setState({balances: balancesResponse.data.accounts })
        }, 100);
    }

    componentWillUnmount() {
        if (this.pollingInterval !== null) {
            clearInterval(this.pollingInterval);
        }
    }

    render() {
        const comp = this;
        const balances = comp.state.balances.map((balance) => {
            return <VenueBalance notifierService={this.props.notifierService} key={'bitstamp/' + balance.currency}
                                 coreTradingService={comp.props.coreTradingService}
                                 currency={balance.currency} currencyName={balance.currency}
                                 valueCurrency={'USD'}
                                 availableBalance={balance.available}
                                 totalBalance={balance.total}
                                 lockedBalance={balance.locked}
                                 currencyType={comp.props.coreTradingService.tradingMetaDataService().assetType( balance.currency )}/>

        });
        return <div className="card ">
            <div className="card-header border-0">
                <h4 className="card-title">Positions</h4>
            </div>
            <div className="card-body pt-0">
                <div className="balance-widget">
                    {comp.state.balances.length === 0 ? (
                        <i className={'fa fa-spinner'}/>
                    ) : (<ul className="list-unstyled" style={{marginTop: '12px'}}>
                        {balances}
                    </ul>)}

                </div>
            </div>
        </div>

    }
}