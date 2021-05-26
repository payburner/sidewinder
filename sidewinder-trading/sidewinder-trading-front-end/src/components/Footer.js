import React from 'react';

export default class Footer extends React.Component {
    constructor(props) {
        super(props);

    }

    render() {
         return <div className="footer">
             <div className="container">
                 <div className="row align-items-center">
                     <div className="col-xl-6 col-md-6">
                         <div className="copy_right">
                             Copyright © 2021 Sidewinder Trading. All Rights Reserved.
                         </div>
                     </div>
                     <div className="col-xl-6 col-md-6 text-lg-right text-center">
                         <div className="social">

                             <a href="https://www.twitter.com/payburner"><i
                                 className="fa fa-twitter"></i></a>

                         </div>
                     </div>
                 </div>
             </div>
         </div>
    }
}