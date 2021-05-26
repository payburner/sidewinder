import React from 'react';

import Footer from '../components/Footer';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import PageTitle from '../components/PageTitle';
import Authentication from "../components/Authentication";
import AccountBalanceCard from "../components/AccountBalanceCard";
import ProfileCard from "../components/ProfileCard";
import AllTrades from "../components/AllTrades";
import VenueNetValue from '../components/VenueNetValue';
import VenueBalances from "../components/VenueBalances";
export default class Login extends React.Component {
    constructor(props) {
        super(props);

    }

    render() {
         return <div id="main-wrapper" className="show">
            <Header/>
            <Sidebar/>
            <PageTitle/>
             <Authentication/>

             <div className="content-body">
                 <div className="container-fluid">
                     <div className="row">
                         <div className="col-xl-4 col-lg-4 col-md-6">
                             <ProfileCard/>
                        </div>
                        <div class="col-xl-4 col-lg-4 col-md-6">
                            <AccountBalanceCard/>
                        </div>
                     </div>
                     <div className="row">
                         <div className="col-xl-12">
                             <AllTrades/>
                         </div>
                     </div>
                     <div className="row">
                         <div className="col-xl-12 col-lg-12 col-xxl-4">
                             <VenueNetValue/>

                         </div>
                     </div>
                     <div className="row">
                         <div className="col-xl-3 col-lg-4 col-xxl-4">
                             <VenueBalances/>
                         </div>
                         <div className="col-xl-9 col-lg-8 col-xxl-8">
                             <AllTrades/>
                         </div>
                     </div>
                 </div>
                </div>

             <Footer/>

         </div>
    }
}