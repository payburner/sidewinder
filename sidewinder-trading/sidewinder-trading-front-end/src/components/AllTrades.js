import React from 'react';
import VenueCurrencyNetValue from "./VenueCurrencyNetValue";
import {Row} from "react-bootstrap";

export default class AllTrades extends React.Component {
    constructor(props) {
        super(props);
        this.pollingInterval = null;
        this.state = { orders: [] }
    }

    componentDidMount() {
        const comp = this;
        this.pollingInterval = setInterval(async () => {
           const orderResponse = await comp.props.coreTradingService.tradingOrdersService().getVenueOrders('bitstamp');
           console.log('Orders:' + JSON.stringify(orderResponse, null, 2));
           comp.setState({orders: orderResponse.data.orders })
        }, 5000);
    }

    componentWillUnmount() {
        if (this.pollingInterval !== null) {
            clearInterval(this.pollingInterval);
        }
    }

    assetIconClass = (asset, size) => {
        return this.props.coreTradingService.tradingMetaDataUIService().assetIconClass(
            asset, size );
    }

    render() {
        const comp = this;
        const orders = comp.state.orders.map((order) =>
            // Correct! Key should be specified inside the array.
            <tr key={order.orderId}>
                <td>
                    <span >{order.status}</span>
                </td>
                <td>
                    <span >{order.order_type}</span>
                </td>
                <td style={{width:'120px'}}>
                    <i style={{float: 'left', marginRight: '12px'}} className={comp.assetIconClass( order.amount_currency, 'small' ) + ' currency-icon-small ' }></i>
                    <i style={{float: 'left', marginRight: '10px', marginTop: '3px', fontSize: '16px!important'}} className={'fa fa-arrow-right currency-icon-small'}/>
                    <i style={{float: 'left'}} className={comp.assetIconClass( order.cost_currency, 'small' ) + ' currency-icon-small ' }></i>

                </td>

                <td className="text-danger">{order.amount} {order.amount_currency}</td>
                <td>{order.cost} {order.cost_currency}</td>
                <td>Fee {order.fee} {order.fee_currency}</td>
            </tr>
        );


        return <div className="card">
            <div className="card-header border-0">
                <h4 className="card-title">All Trades</h4>
            </div>
            <div className="card-body pt-0">
                <div className="transaction-table">
                    <div className="table-responsive">
                        <table className="table mb-0 table-responsive-sm">
                            <tbody>

                            {orders}


                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    }
}