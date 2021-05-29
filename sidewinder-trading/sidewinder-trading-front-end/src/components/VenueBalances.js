import React from 'react';
import VenueBalance from "./VenueBalance";
import uuid4 from "uuid4/browser.mjs";
export default class VenueBalances extends React.Component {
    constructor(props) {
        super(props);

        this.state = { balances: [], openOnly: false, id: uuid4()}

    }

    componentDidMount() {
        const comp = this;
        comp.props.coreTradingService.tradingBalancesService().subscribe(comp.state.id, 'bitstamp', (a)=>comp.setState({balances:a}))
    }

    toggle() {
       this.setState({openOnly:!this.state.openOnly});
    }

    componentWillUnmount() {
        const comp = this;
        comp.props.coreTradingService.tradingBalancesService().unsubscribe(comp.state.id);
    }

    render() {
        const comp = this;
        const balances = comp.state.balances
            .filter((balance)=> comp.state.openOnly?balance.available>0:true)
            .map((balance) => {
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
                    ) : (<ul onClick={() => comp.toggle()} className="list-unstyled" style={{marginTop: '12px'}}>
                        {balances}
                    </ul>)}

                </div>
            </div>
        </div>

    }
}