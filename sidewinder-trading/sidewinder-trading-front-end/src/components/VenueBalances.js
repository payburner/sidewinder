import React from 'react';
import VenueBalance from "./VenueBalance";
export default class VenueBalances extends React.Component {
    constructor(props) {
        super(props);

    }


    render() {
        const comp = this;
        return <div className="card ">
            <div className="card-header border-0">
                <h4 className="card-title">Positions</h4>
            </div>
            <div className="card-body pt-0">
                <div className="balance-widget">
                    <ul className="list-unstyled" style={{marginTop: '12px'}}>
                        <VenueBalance coreTradingService={comp.props.coreTradingService} currency={'BTC'} currencyName={'Bitcoin'} valueCurrency={'USD'} currencyType={'CRYPTO'}/>
                        <VenueBalance coreTradingService={comp.props.coreTradingService} currency={'LTC'} currencyName={'Litecoin'} valueCurrency={'USD'}  currencyType={'CRYPTO'}/>
                        <VenueBalance coreTradingService={comp.props.coreTradingService} currency={'XRP'} currencyName={'XRP'} valueCurrency={'USD'}  currencyType={'CRYPTO'}/>
                        <VenueBalance coreTradingService={comp.props.coreTradingService} currency={'DASH'} currencyName={'Dash'} valueCurrency={'USD'}  currencyType={'CRYPTO'}/>
                        <VenueBalance coreTradingService={comp.props.coreTradingService} currency={'USD'} currencyName={'US Dollar'} valueCurrency={'USD'}  currencyType={'FIAT'}/>
                        <VenueBalance coreTradingService={comp.props.coreTradingService} currency={'EUR'} currencyName={'Euro'} valueCurrency={'USD'}  currencyType={'FIAT'}/>
                    </ul>
                </div>
            </div>
        </div>

    }
}