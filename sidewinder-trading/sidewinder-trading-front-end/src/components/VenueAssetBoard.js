import React from 'react';
import VenueBalance from "./VenueBalance";
import uuid4 from "uuid4/browser.mjs";
import VenueCurrencyNetValue from "./VenueCurrencyNetValue";
export default class VenueAssetBoard extends React.Component {
    constructor(props) {
        super(props);

        this.state = { balances: [], openOnly: false, id: uuid4()}

    }

    componentDidMount() {
        const comp = this;
        comp.props.coreTradingService.tradingBalancesService().subscribe(comp.state.id, 'bitstamp', (a)=>comp.setState({balances:a}))
    }

    componentWillUnmount() {
        const comp = this;
        comp.props.coreTradingService.tradingBalancesService().unsubscribe(comp.state.id);
    }

    render() {
        const comp = this;
        const balances = comp.state.balances
            .filter((balance)=> typeof comp.props.filter !== 'undefined' ? comp.props.filter(balance):true)
            .map((balance) => {
            return <VenueCurrencyNetValue toggleable={true} marginRight={'40px'}
                                          coreTradingService={this.props.coreTradingService}
                                          onSelectAsset={(asset) => typeof this.props.onSelectAsset !== 'undefined' ? this.props.onSelectAsset(asset):(console.log('No on select asset:' + asset))}
                                          onDeselectAsset={(asset) => typeof this.props.onDeselectAsset !== 'undefined' ? this.props.onDeselectAsset(asset):(console.log('No on deselect asset:' + asset))}
                                          currency={balance.currency}
                                          currencyName={balance.currency}
                                          availableBalance={balance.available}/>


        });
        return <div className="card ">
            <div className="card-header border-0">
                <h4 className="card-title">{comp.props.title}</h4>
            </div>
            <div className="card-body pt-0">
                <div className="balance-widget">
                    {comp.state.balances.length === 0 ? (
                        <i className={'fa fa-spinner'}/>
                    ) : (<div style={{marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))'}}>
                        {balances}
                    </div>)}

                </div>
            </div>
        </div>

    }
}