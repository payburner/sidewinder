import React from 'react';
import bitstampImage from '../assets/images/exchanges/bitstamp.png'
import bitsoImage from '../assets/images/exchanges/bitso.svg'


export default class VenueNetValue extends React.Component {
    constructor(props) {
        super(props);
        this.state = { balance: 'TODO' }
    }

    componentDidMount() {
        const comp = this;

    }

    render() {
        const comp = this;
        return <div>
                <div className="balance-widget" style={{float: 'left', padding: '20px 20px 20px 20px'}}>
                    <div className="total-balance">
                        <img className="fa fa-bank" src={bitstampImage}
                             style={{height: '50px', width: '50px', marginBottom: '12px'}}></img>
                        <h5>BITSTAMP</h5>
                        <h3>$ {comp.state.balance}</h3>
                    </div>
                </div>
        </div>


    }
}