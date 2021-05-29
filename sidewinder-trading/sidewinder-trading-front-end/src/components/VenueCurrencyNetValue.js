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

    toggle(e) {
        if (typeof this.props.toggleable && this.props.toggleable) {
            const selected = !this.state.toggled;
            this.setState( {toggled: !this.state.toggled});
            e.preventDefault();
            e.stopPropagation();
            if (selected && typeof this.props.onSelectAsset !== 'undefined') {
                this.props.onSelectAsset( this.props.currency );
            }
            else if (!selected && typeof this.props.onDeselectAsset !== 'undefined') {
                this.props.onDeselectAsset(this.props.currency );
            }
        }
    }

    render() {
        const comp = this;
        const style = {float: 'left', minWidth: '160px', maxWidth: '160px', padding: '20px 20px 20px 20px'};
        if (typeof comp.props.toggleable !== 'undefined' && comp.props.toggleable && comp.state.toggled) {
            style.opacity = '.60';
            style.backgroundColor = 'grey';
        }

        if (typeof comp.props.marginRight !== 'undefined') {
            style.marginRight = comp.props.marginRight
        }

        return <div onClick={(e)=>comp.toggle(e)} className="venue-currency-net-value-widget" style={style}>
                    <div className="venue-currency-net-value">
                        <AssetIcon style={{margin: '0 auto'}} asset={comp.props.currency} size={'large'}/>
                        <h5 style={{marginTop: '12px'}}>{comp.props.currencyName}</h5>
                        <h3>{comp.props.availableBalance}</h3>
                    </div>
                </div>


    }
}