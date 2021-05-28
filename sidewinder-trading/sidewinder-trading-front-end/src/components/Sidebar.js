import React from 'react';

export default class Sidebar extends React.Component {
    constructor(props) {
        super(props);

    }

    render() {
         return <div className="sidebar">
             <div className="menu">
                 <ul>
                     <li>
                         <a href="#" data-toggle="tooltip" data-placement="right"
                            title="Home">
                             <span><i className="fa fa-home"></i></span>
                         </a>
                     </li>
                     <li><a href="#" data-toggle="tooltip" data-placement="right"
                            title="Exchange">
                         <span><i className="fa fa-exchange"></i></span>
                     </a>
                     </li>
                     <li><a href="#" data-toggle="tooltip" data-placement="right"
                            title="Account">
                         <span><i className="fa fa-user"></i></span>
                     </a>
                     </li>
                     <li><a href="#" data-toggle="tooltip"
                            data-placement="right" title="Setting">
                         <span><i className="fa fa-cog"></i></span>
                     </a>
                     </li>
                 </ul>
             </div>
         </div>
    }
}