import React from 'react';
import profileImage from '../assets/images/profile/2.png'
export default class ProfileCard extends React.Component {
    constructor(props) {
        super(props);

    }

    render() {
         return <div className="card profile_card">
             <div className="card-body">
                 <div className="media">
                     <img className="mr-3 rounded-circle mr-0 mr-sm-3" src={profileImage}
                          width="60"
                          height="60" alt=""/>
                         <div className="media-body">
                             <span>Hello</span>
                             <h4 className="mb-2">Demo User</h4>

                         </div>
                 </div>

                 <ul className="card-profile__info">
                     <li>
                         <h5 className="mr-4">Address</h5>
                         <span className="text-muted">San Francisco, CA</span>
                     </li>

                     <li>
                         <h5 className="text-danger mr-4">Last Log</h5>
                         <span className="text-danger">3 February, 2020, 10:00 PM</span>
                     </li>
                 </ul>
                 <div className="social-icons">

                     <a className="twitter text-center"
                        href="https://www.twitter.com/CryptoCwby"><span><i
                         className="fa fa-twitter"></i></span></a>

                 </div>
             </div>
         </div>
    }
}