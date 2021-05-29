import React from 'react';
import VenueBalance from "./VenueBalance";
import uuid4 from "uuid4/browser.mjs";
import VenueCurrencyNetValue from "./VenueCurrencyNetValue";
export default class VenueCryptoBoard extends React.Component {
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
            return <VenueCurrencyNetValue toggleable={true}
                                          coreTradingService={this.props.coreTradingService}
                                          currency={balance.currency}
                                          currencyName={balance.currency}
                                          availableBalance={balance.availableBalance}/>


        });
        return <div className="card ">
            <div className="card-header border-0">
                <h4 className="card-title">Crypto Positions</h4>
            </div>
            <div className="card-body pt-0">
                <div className="balance-widget">
                    {comp.state.balances.length === 0 ? (
                        <i className={'fa fa-spinner'}/>
                    ) : (<div onClick={() => comp.toggle()} style={{marginTop: '12px'}}>
                        {balances}
                    </div>)}

                </div>
            </div>
        </div>

    }
}