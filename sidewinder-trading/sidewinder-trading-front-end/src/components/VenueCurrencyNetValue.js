import React from 'react';
import bitstampImage from '../assets/images/exchanges/bitstamp.png'
import bitsoImage from '../assets/images/exchanges/bitso.svg'
import AssetIcon from "./AssetIcon";


export default class VenueCurrencyNetValue extends React.Component {
    constructor(props) {
        super(props);

    }


    render() {
        const comp = this;
        return <div className="venue-currency-net-value-widget" style={{float: 'left', minWidth: '120px', padding: '20px 20px 20px 20px'}}>
                    <div className="venue-currency-net-value">
                        <AssetIcon style={{margin: '0 auto'}} asset={comp.props.currency} size={'large'}/>
                        <h5 style={{marginTop: '12px'}}>{comp.props.currencyName}</h5>
                        <h3>{comp.props.availableBalance}</h3>
                    </div>
                </div>


    }
}