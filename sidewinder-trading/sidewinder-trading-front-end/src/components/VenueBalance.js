import React, { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Input, Label, Form, FormGroup } from 'reactstrap';
import VenueCurrencyNetValue from "./VenueCurrencyNetValue";
import {Row, Toast} from "react-bootstrap";
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import RangeSlider from 'react-bootstrap-range-slider';
import AssetIcon from "./AssetIcon";
export default class VenueBalance extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            modal: false,
            sourceCurrency: null,
            sourceCurrencyType: null,
            percentAmount: 100,
            tradeable: null
        }
    }

    toggle = () => this.setState({
modal: !this.state.modal
});

    dragStart = (event) => {
        event.dataTransfer.setData("text/plain", JSON.stringify({
            sourceCurrency: this.props.currency, sourceCurrencyType: this.props.currencyType,
            availableBalance: this.props.availableBalance
        }))
        this.setState({targetbox: true});
    }

    drop = (event) => {
        const data = event.dataTransfer.getData("text/plain");
        if (data) {
            const pData = JSON.parse(data);
            if (this.props.coreTradingService.tradingMetaDataService().isTradeable(this.exchange, pData.sourceCurrency, this.props.currency)) {
                if (pData.availableBalance === 0) {
                    this.setState({
                        sourceCurrency: null,
                        sourceCurrencyType: null,
                        availableBalance: null,
                        tradeable: 'FALSE'
                    });
                    event.dataTransfer.clearData();
                    this.props.notifierService.notify('We can not initiate a trade for this pair.  Your available balance of ' + pData.sourceCurrency + ' is zero.');
                }
                else {
                    pData.tradeable = 'TRUE';
                    this.setState(pData);
                    event.dataTransfer.clearData();
                    this.toggle();
                }

            }
            else {
                this.setState({
                    sourceCurrency: null,
                    sourceCurrencyType: null,
                    availableBalance: null,
                    tradeable: 'FALSE'
                });
                event.dataTransfer.clearData();
                this.props.notifierService.notify('The pair is not tradeable on this venue');
            }
        }

    }

    onDragOver = (event) => {
        event.preventDefault();
    }

    onDragLeave = (event) => {
        this.setState({
            sourceCurrency: null,
            sourceCurrencyType: null,
            availableBalance: null,
            tradeable: null
        })
    }

    onDragEnter = (event) => {
    }

    render() {
        const comp = this;

        return <li className="media" draggable={true}
                   onDrop={(e) => comp.drop(e)}
                   onDragOver={(e) => comp.onDragOver(e)}
                   onDragEnter={(e) => comp.onDragEnter(e)}
                   onDragLeave={(e) => comp.onDragLeave(e)}
                   onDragStart={(e) => comp.dragStart(e)}
        >
            <span style={{display: 'flex'}}>
                <AssetIcon asset={comp.props.currency} size={'medium'} classes={'grabbable mr-3'}/>
            </span>

            <div className="media-body">
                <h5 className="m-0">{comp.props.currencyName}</h5>
            </div>
            <div className="text-right">
                <h5>{comp.props.availableBalance} {comp.props.currency}</h5>
                <span>equiv-todo {comp.props.valueCurrency}</span>
            </div>
            { this.state.modal ? (<Modal contentClassName={'trading-modal'} isOpen={this.state.modal} toggle={(e)=>this.toggle(e)} className={'className'}>
                <ModalHeader style={{backgroundColor:'rgb(58, 51, 97)',   filter: 'alpha(opacity=85)',
                    opacity: '0.90'}} >Transfer Balance</ModalHeader>
                <ModalBody style={{backgroundColor:'rgb(58, 51, 97)',   filter: 'alpha(opacity=85)',
                    opacity: '0.90', height: '325px'}} >
                    <Row style={{paddingLeft: '36px'}}>
                        <VenueCurrencyNetValue coreTradingService={this.props.coreTradingService} currency={this.state.sourceCurrency}
                                               currencyName={this.state.sourceCurrency} availableBalance={this.props.coreTradingService.tradingMetaDataService()
                            .scaleAmount('bitstamp', this.state.sourceCurrency, this.state.availableBalance*(comp.state.percentAmount/100))}/>
                        <i style={{float: 'left', padding: '80px', fontSize: '40px'}} className={'fa fa-arrow-right currency-icon-large execute-button'}/>
                        <VenueCurrencyNetValue coreTradingService={this.props.coreTradingService} currency={comp.props.currency} currencyName={comp.props.currency}/>
                    </Row>
                    <Row style={{paddingLeft: '175px', paddingRight: '175px'}}>

                        <h5 style={{float:"left"}}>Percent to Transfer</h5>
                    </Row>
                    <Row style={{paddingLeft: '175px', paddingRight: '175px'}}>
                        <RangeSlider min={10}
                                     value={comp.state.percentAmount} step={10}
                                     onChange={changeEvent => comp.setState({percentAmount:changeEvent.target.value})}
                        />
                    </Row>
                </ModalBody>
                <ModalFooter style={{height: '0px', borderTop: 'none', backgroundColor:'rgb(58, 51, 97)',   filter: 'alpha(opacity=85)',
                    opacity: '0.90'}} >

                </ModalFooter>
            </Modal>) :('')}

        </li>


    }
}