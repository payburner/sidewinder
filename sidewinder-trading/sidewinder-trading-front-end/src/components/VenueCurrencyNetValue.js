import React from 'react';
import bitstampImage from '../assets/images/exchanges/bitstamp.png'
import bitsoImage from '../assets/images/exchanges/bitso.svg'


export default class VenueCurrencyNetValue extends React.Component {
    constructor(props) {
        super(props);
        this.state = { balance: 1000.00 }
    }

    componentDidMount() {
        const comp = this;

    }

    render() {
        const comp = this;
        return <div className="venue-currency-net-value-widget" style={{float: 'left', padding: '20px 20px 20px 20px'}}>
                    <div className="venue-currency-net-value">
                        <i className={'cc currency-icon-large ' + comp.props.currency }></i>
                        <h5 style={{marginTop: '12px'}}>{comp.props.currencyName}</h5>
                        <h3>$ {comp.state.balance}</h3>
                    </div>
                </div>


    }
}