import React from 'react';

export default class AccountBalanceCard extends React.Component {
    constructor(props) {
        super(props);

    }

    render() {
         return <div className="card acc_balance">
             <div className="card-header">
                 <h4 className="card-title">Wallet</h4>
             </div>
             <div className="card-body">
                 <span>Net Value USD</span>
                 <h3>0.0230145 USD</h3>
             </div>
         </div>
    }
}