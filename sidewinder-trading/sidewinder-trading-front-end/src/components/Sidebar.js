import React from 'react';

export default class Sidebar extends React.Component {
    constructor(props) {
        super(props);

    }

    notifyMenuSwitch( item ) {
        if (typeof this.props.menuListener !== 'undefined') {
            this.props.menuListener( item );
        }
        else {
            console.log('No MenuListener for Sidebar switch:' + item);
        }

    }

    render() {
        const comp = this;
         return <div className="sidebar">
             <div className="menu">
                 <ul>
                     <li>
                         <a href="#" onClick={(e)=>this.notifyMenuSwitch('home')} data-toggle="tooltip" data-placement="right"
                            title="Home">
                             <span><i className="fa fa-home"></i></span>
                         </a>
                     </li>
                     <li><a href="#" onClick={(e)=>this.notifyMenuSwitch('exchange')} data-toggle="tooltip" data-placement="right"
                            title="Exchange">
                         <span><i className="fa fa-exchange"></i></span>
                     </a>
                     </li>
                     <li><a href="#" onClick={(e)=>this.notifyMenuSwitch('account')} data-toggle="tooltip" data-placement="right"
                            title="Account">
                         <span><i className="fa fa-user"></i></span>
                     </a>
                     </li>
                     <li><a href="#" onClick={(e)=>this.notifyMenuSwitch('settings')} data-toggle="tooltip"
                            data-placement="right" title="Setting">
                         <span><i className="fa fa-cog"></i></span>
                     </a>
                     </li>
                 </ul>
             </div>
         </div>
    }
}