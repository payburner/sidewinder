import React from 'react';
import VenueBalance from "./VenueBalance";
import uuid4 from "uuid4/browser.mjs";
import VenueAssetBoard from "./VenueAssetBoard";
export default class Level2Component extends React.Component {
    constructor(props) {
        super(props);
    }

    sweepOut() {
        alert('sweep out');
    }

    sweepIn() {
        alert('sweep in');
    }

    render() {
        const comp = this;

        return <div className="container-fluid">
            <div className="row">
                <div className="col-xl-2 col-lg-3 col-xxl-3">
                    <VenueAssetBoard notifierService={comp.props.notifierService}
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
                            <i onClick={(e) => comp.sweepOut()} style={{
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
                        notifierService={comp.props.notifierService}
                        title={'Crypto Positions'}
                        filter={(balance) => comp.props.coreTradingService.tradingMetaDataService().assetType(balance.currency) === 'CRYPTO'}
                        coreTradingService={comp.props.coreTradingService}/>
                </div>
            </div>
        </div>

    }
}