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
import NotifierService from "../services/NotifierService";
export default class Login extends React.Component {
    constructor(props) {
        super(props);
        this.notifierService = new NotifierService();
    }

    render() {
        const comp = this;
         return <div id="main-wrapper" className="show">
             <Header notifierService={this.notifierService}/>
             <Sidebar/>
             <PageTitle/>
             <Authentication/>

             <div className="content-body">
                 <div className="container-fluid">
                    <div className="row">
                        <div className="col-xl-3 col-lg-4 col-xxl-4">
                            <VenueBalances notifierService={this.notifierService} coreTradingService={comp.props.coreTradingService}/>
                        </div>
                        <div className="col-xl-9 col-lg-8 col-xxl-8">
                            <AllTrades coreTradingService={comp.props.coreTradingService}/>
                        </div>
                    </div>
                 </div>
             </div>
             <Footer/>
         </div>
    }
}