import React, { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Input, Label, Form, FormGroup } from 'reactstrap';
import VenueCurrencyNetValue from "./VenueCurrencyNetValue";
import {Row} from "react-bootstrap";
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import RangeSlider from 'react-bootstrap-range-slider';
export default class VenueBalance extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            modal: false,
            sourceCurrency: null,
            sourceCurrencyType: null,
            amount: 100
        }
    }

    toggle = () => this.setState({
modal: !this.state.modal
});

    dragStart = (event) => {
        event.dataTransfer.setData("text/plain", JSON.stringify({
            sourceCurrency: this.props.currency, sourceCurrencyType: this.props.currencyType
        }))
        this.setState({targetbox: true});
    }

    drop = (event) => {
        const data = event.dataTransfer.getData("text/plain");
        if (data) {
            const pData = JSON.parse(data);
            this.setState(pData);
            event.dataTransfer.clearData();
            this.toggle();
        }

    }

    onDragOver = (event) => {
        event.preventDefault();
    }

    onDragLeave = (event) => {
        this.setState({
            sourceCurrency: null,
            sourceCurrencyType: null
        })
    }

    onDragEnter = (event) => {
    }

    assetIconClass = (asset, size) => {
        return this.props.coreTradingService.tradingMetaDataUIService().assetIconClass(
            asset, size);
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
                <i className={'grabbable ' + comp.assetIconClass(
                    comp.props.currency, 'medium') + ' mr-3'}></i>
            </span>

            <div className="media-body">
                <h5 className="m-0">{comp.props.currencyName}</h5>
            </div>
            <div className="text-right">
                <h5>0.000242 {comp.props.currency} {comp.props.currencyType}</h5>
                <span>0.125 {comp.props.valueCurrency}</span>
            </div>
            <Modal contentClassName={'trading-modal'} isOpen={this.state.modal} toggle={(e)=>this.toggle(e)} className={'className'}>
                <ModalHeader style={{backgroundColor:'rgb(58, 51, 97)',   filter: 'alpha(opacity=85)',
                    opacity: '0.90'}} >Transfer Balance</ModalHeader>
                <ModalBody style={{backgroundColor:'rgb(58, 51, 97)',   filter: 'alpha(opacity=85)',
                    opacity: '0.90', height: '325px'}} >
                    <Row style={{paddingLeft: '36px'}}>
                        <VenueCurrencyNetValue coreTradingService={this.props.coreTradingService} currency={this.state.sourceCurrency}
                                           currencyName={this.state.sourceCurrency}/>
                        <i style={{float: 'left', padding: '80px', fontSize: '40px'}} className={'fa fa-arrow-right currency-icon-large execute-button'}/>
                        <VenueCurrencyNetValue coreTradingService={this.props.coreTradingService} currency={comp.props.currency} currencyName={comp.props.currency}/>
                    </Row>
                    <Row style={{paddingLeft: '175px', paddingRight: '175px'}}>

                        <h5 style={{float:"left"}}>Percent to Transfer</h5>
                    </Row>
                    <Row style={{paddingLeft: '175px', paddingRight: '175px'}}>
                        <RangeSlider min={10}
                            value={comp.state.amount} step={10}
                            onChange={changeEvent => comp.setState({amount:changeEvent.target.value})}
                        />
                    </Row>
                </ModalBody>
                <ModalFooter style={{height: '0px', borderTop: 'none', backgroundColor:'rgb(58, 51, 97)',   filter: 'alpha(opacity=85)',
                    opacity: '0.90'}} >

                </ModalFooter>
            </Modal>
        </li>


    }
}