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
            amount: 100,
            tradeable: null
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

            if (this.props.coreTradingService.tradingMetaDataService().isTradeable(this.exchange, data.sourceCurrency, this.props.currency)) {
                const pData = JSON.parse(data);
                pData.tradeable = 'TRUE';
                this.setState(pData);
                event.dataTransfer.clearData();
                this.toggle();
            }
            else {
                const pData = JSON.parse(data);
                this.setState({
                    sourceCurrency: null,
                    sourceCurrencyType: null,
                    tradeable: null
                });
                event.dataTransfer.clearData();

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
            tradeable: null
        })
    }

    onDragEnter = (event) => {
    }

    render() {
        const comp = this;
        if (comp.state.tradeable !== null && comp.state.tradeable === 'FALSE') {
            setTimeout(()=> {
                comp.setState({tradeable: null});
            }, 2000);
        }
        return <li className="media" draggable={true}
                   onDrop={(e) => comp.drop(e)}
                   onDragOver={(e) => comp.onDragOver(e)}
                   onDragEnter={(e) => comp.onDragEnter(e)}
                   onDragLeave={(e) => comp.onDragLeave(e)}
                   onDragStart={(e) => comp.dragStart(e)}
        >

            {comp.state.tradeable !== null && comp.state.tradeable === 'FALSE' ? (
                <Toast show={true} onClose={()=>comp.setState({tradeable: null})}>
                <Toast.Header>
                    <strong className="mr-auto">Oops!</strong>
                </Toast.Header>
                <Toast.Body>This pair is not tradeable</Toast.Body>
            </Toast>) : ('')}
            <span style={{display: 'flex'}}>
                <AssetIcon asset={comp.props.currency} size={'medium'} classes={'grabbable mr-3'}/>
            </span>

            <div className="media-body">
                <h5 className="m-0">{comp.props.currencyName}</h5>
            </div>
            <div className="text-right">
                <h5>{comp.props.availableBalance} {comp.props.currency}</h5>
                <span>0.125 {comp.props.valueCurrency}</span>
            </div>
            <Modal contentClassName={'trading-modal'} isOpen={this.state.modal} toggle={(e)=>this.toggle(e)} className={'className'}>
                <ModalHeader style={{backgroundColor:'rgb(58, 51, 97)',   filter: 'alpha(opacity=85)',
                    opacity: '0.90'}} >Transfer Balance</ModalHeader>
                <ModalBody style={{backgroundColor:'rgb(58, 51, 97)',   filter: 'alpha(opacity=85)',
                    opacity: '0.90', height: '325px'}} >
                    <Row style={{paddingLeft: '36px'}}>
                        <VenueCurrencyNetValue coreTradingService={this.props.coreTradingService} currency={this.state.sourceCurrency}
                                           currencyName={this.state.sourceCurrency} availableBalance={this.props.availableBalance}/>
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