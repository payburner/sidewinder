import React from 'react';

import VenueNetValue from './VenueNetValue';
import VenueBalances from './VenueBalances';

export default class Portfolio extends React.Component {
    constructor(props) {
        super(props);

    }

    render() {
         return <div className="card balance-widget">
             <div className="card-header border-0 py-0">
                 <h4 className="card-title">Your Portfolio </h4>
             </div>
             <div className="card-body pt-0">
                 <div className="balance-widget">
                     <VenueNetValue/>
                     <VenueBalances/>
                 </div>
             </div>
         </div>
    }
}