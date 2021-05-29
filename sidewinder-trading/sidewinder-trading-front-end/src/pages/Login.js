import React from 'react';

import Footer from '../components/Footer';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import PageTitle from '../components/PageTitle';
import Authentication from "../components/Authentication";
import AllTrades from "../components/AllTrades";
import VenueBalances from "../components/VenueBalances";
import NotifierService from "../services/NotifierService";
import VenueAssetBoard from "../components/VenueAssetBoard";

export default class Login extends React.Component {
    constructor(props) {
        super(props);
        this.notifierService = new NotifierService();
        this.state = {
            loggedIn: false,
            page: 'home'
        }
    }

    componentDidMount() {
        const comp = this;
        this.props.coreTradingService.tokenService().subscribe((token) => {
            comp.setState({loggedIn: token !== null});
        });
    }

    handleHeaderMenuSelection(i) {

        if (i === 'disconnect') {
            this.props.coreTradingService.tokenService().removeToken();
        } else if (i === 'home' || i === 'exchange') {
            this.setState({page: i})
        } else {
            console.log('unhandled header menu selection:' + i);
        }
    }

    handleSidebarMenuSelection(i) {
        if (i === 'home' || i === 'exchange') {
            this.setState({page: i})
        } else {
            console.log('unhandled sidebar menu selection:' + i);
        }
    }

    render() {
        const comp = this;

        if (!this.state.loggedIn) {
            return <div id="main-wrapper" className="show">
                <Authentication tokenService={comp.props.coreTradingService.tokenService()}/>
                <Footer/>
            </div>
        } else {
            if (comp.state.page === 'home') {
                return <div id="main-wrapper" className="show">
                    <Header notifierService={this.notifierService}
                            menuListener={(e) => comp.handleHeaderMenuSelection(e)}/>
                    <Sidebar menuListener={(e) => comp.handleSidebarMenuSelection(e)}/>
                    <PageTitle/>

                    <div className="content-body">
                        <div className="container-fluid">
                            <div className="row">
                                <div className="col-xl-3 col-lg-4 col-xxl-4">
                                    <VenueBalances notifierService={this.notifierService}
                                                   coreTradingService={comp.props.coreTradingService}/>
                                </div>
                                <div className="col-xl-9 col-lg-8 col-xxl-8">
                                    <AllTrades coreTradingService={comp.props.coreTradingService}/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Footer/>
                </div>
            } else if (comp.state.page === 'exchange') {
                return <div id="main-wrapper" className="show">
                    <Header notifierService={this.notifierService}
                            menuListener={(e) => comp.handleHeaderMenuSelection(e)}/>
                    <Sidebar menuListener={(e) => comp.handleSidebarMenuSelection(e)}/>
                    <PageTitle/>

                    <div className="content-body">
                        <div className="container-fluid">
                            <div className="row">
                                <div className="col-xl-2 col-lg-3 col-xxl-3">
                                    <VenueAssetBoard notifierService={this.notifierService}
                                                     title={'Fiat Positions'}
                                                     filter={(balance) => balance.currency === 'USD'}
                                                     coreTradingService={comp.props.coreTradingService}/>
                                </div>
                                <div className="col-xl-1 col-lg-1 col-xxl-1">
                                    <div className="card ">
                                        <div className="card-header border-0">
                                            <h4 className="card-title"></h4>
                                        </div>
                                        <div className="card-body pt-0">
                                            <i onClick={(e) => comp.sweepIn()} style={{
                                                float: 'left',
                                                padding: '80px 30px 80px 30px',
                                                fontSize: '40px'
                                            }}
                                               className={'fa fa-arrow-left currency-icon-large execute-button'}/>
                                            <i onClick={(e) => alert('hi')} style={{
                                                float: 'left',
                                                padding: '80px 30px 80px 30px',
                                                fontSize: '40px'
                                            }}
                                               className={'fa fa-arrow-right currency-icon-large execute-button'}/>

                                        </div>
                                    </div>
                                </div>
                                <div className="col-xl-9 col-lg-8 col-xxl-8">
                                    <VenueAssetBoard
                                        notifierService={this.notifierService}
                                        title={'Crypto Positions'}
                                        filter={(balance) => comp.props.coreTradingService.tradingMetaDataService().assetType(balance.currency) === 'CRYPTO'}
                                        coreTradingService={comp.props.coreTradingService}/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Footer/>
                </div>
            } else {
                return <div>unknown page</div>
            }
        }


    }
}