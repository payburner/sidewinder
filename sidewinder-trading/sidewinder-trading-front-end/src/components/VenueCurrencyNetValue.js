import React from 'react';
import bitstampImage from '../assets/images/exchanges/bitstamp.png'
import bitsoImage from '../assets/images/exchanges/bitso.svg'
import AssetIcon from "./AssetIcon";


export default class VenueCurrencyNetValue extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            toggled : false
        }
    }

    toggle() {
        if (typeof this.props.toggleable && this.props.toggleable) {
            this.state.toggled = !this.state.toggled;
        }
    }

    render() {
        const comp = this;
        const style = {float: 'left', minWidth: '120px', padding: '20px 20px 20px 20px'};
        if (typeof comp.props.toggleable !== 'undefined' && comp.props.toggleable && comp.state.toggled) {
            style.opacity = '.60';
            style.backgroundColor
        }

        return <div onClick={(e)=>comp.toggle()} className="venue-currency-net-value-widget" style={style}>
                    <div className="venue-currency-net-value">
                        <AssetIcon style={{margin: '0 auto'}} asset={comp.props.currency} size={'large'}/>
                        <h5 style={{marginTop: '12px'}}>{comp.props.currencyName}</h5>
                        <h3>{comp.props.availableBalance}</h3>
                    </div>
                </div>


    }
}