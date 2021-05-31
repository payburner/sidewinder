import React from 'react';
import VenueAssetBoard from "./VenueAssetBoard";
import AllTrades from "./AllTrades";
import {Button} from "react-bootstrap";
export default class Level2Component extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fiat: null,
            crypto: [],
            level2Active: false,
        }
        this.interval = null;
    }

    startPolling() {
        const comp = this;
      this.interval = setInterval(()=> {
          comp.checkSweep();
      }, 5000);
    }

    sweepOut() {
        const comp = this;
        if (this.commonValidation()) {
            console.log('sweep out:' + this.state.fiat + ' -> ' + JSON.stringify(this.state.crypto, null, 2));
            this.props.coreTradingService.level2Service().sweepOut('bitstamp', this.state.fiat, this.state.crypto )
                .then((response) => {
                    if (response.status === 200) {
                        comp.setState({level2Active: true})
                    }
                console.log('Sweep Out Result:' + JSON.stringify(response, null, 2));

            });
        }
    }

    sweepIn() {
        const comp = this;
        if (this.commonValidation()) {
         console.log('sweep in:' + JSON.stringify(this.state.crypto, null, 2) + ' -> ' + this.state.fiat);
          this.props.coreTradingService.level2Service().sweepIn('bitstamp', this.state.crypto, this.state.fiat )
              .then((response) => {
                  if (response.status === 200) {
                      comp.setState({level2Active: true})
                  }
              console.log('Sweep In Result:' + JSON.stringify(response, null, 2));
          });
        }
    }

    commonValidation() {
        if (this.state.level2Active) {
            this.props.notifierService.notify('There is a level2 gesture in progress.  Please wait...');
        }
        else if (this.state.fiat === null) {
            this.props.notifierService.notify('Please select a fiat currency');
            return false;
        }
        else if (this.state.crypto.length === 0) {
            this.props.notifierService.notify('Please select at least one crypto currency');
            return false
        }
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }
        return true;
    }

    selectFiat( asset ) {
        this.setState({fiat:asset})
    }
    deselectFiat( asset ) {
        this.setState({fiat:null})
    }
    selectCrypto( asset ) {
        if (this.state.crypto.filter((c)=>c === asset).length === 0) {
          const crypto = this.state.crypto;
          crypto.push(asset);
          this.setState({crypto:crypto});
        }

    }
    deselectCrypto( asset ) {
        if (this.state.crypto.filter((c)=>c === asset).length >= 0) {
          const crypto = this.state.crypto.filter((c)=>c!== asset);
          this.setState({crypto:crypto})
        }

    }

    checkSweep() {
        const comp = this;
        this.props.coreTradingService.level2Service().instances('bitstamp' )
            .then((response) => {
                console.log('Level 2 Instances Result:' + JSON.stringify(response, null, 2));
                comp.setState({level2Active:response.status === 200 && response.data.length > 0});
                if (!(response.status === 200 && response.data.length > 0) && comp.interval !== null) {
                    clearInterval(comp.interval);
                    comp.interval = null;
                }
            });
    }

    render() {
        const comp = this;

        return <div className="container-fluid">
            {!comp.state.level2Active ? (<div className="row">
                <div className="col-xl-2 col-lg-3 col-xxl-3">

                    <VenueAssetBoard notifierService={comp.props.notifierService}
                                     title={'Fiat Positions'}
                                     onSelectAsset={(asset) => this.selectFiat(asset)}
                                     onDeselectAsset={(asset) => this.deselectFiat(asset)}
                                     filter={(balance) => balance.currency === 'USD'}
                                     coreTradingService={comp.props.coreTradingService}/>
                </div>
                <div className="col-xl-1 col-lg-1 col-xxl-1">
                    <div className="card">
                        <div className="card-header border-0">
                            <h4 className="card-title"></h4>
                        </div>
                        <div className="card-body pt-0">
                            <i onClick={(e) => comp.sweepIn()} style={{
                                float: 'left',
                                padding: '20px 30px 20px 30px',
                                fontSize: '40px'
                            }}
                               className={'fa fa-arrow-left currency-icon-large execute-button'}/>
                            <i onClick={(e) => comp.sweepOut()} style={{
                                float: 'left',
                                padding: '20px 30px 20px 30px',
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
                        onSelectAsset={(asset) => this.selectCrypto(asset)}
                        onDeselectAsset={(asset) => this.deselectCrypto(asset)}
                        filter={(balance) => comp.props.coreTradingService.tradingMetaDataService().assetType(balance.currency) === 'CRYPTO'}
                        coreTradingService={comp.props.coreTradingService}/>
                </div>
            </div>) : (<div className="row">
                <div className="col-xl-12 col-lg-12 col-xxl-12">

                     Level 2 Gesture is Working
                </div>

            </div>)}

            <div className="row">
                <AllTrades coreTradingService={comp.props.coreTradingService}/>
            </div>
        </div>

    }
}