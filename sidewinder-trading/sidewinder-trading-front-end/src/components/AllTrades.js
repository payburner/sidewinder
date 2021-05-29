import React from 'react';
import VenueCurrencyNetValue from "./VenueCurrencyNetValue";
import {Row} from "react-bootstrap";
import AssetIcon from "./AssetIcon";

export default class AllTrades extends React.Component {
    constructor(props) {
        super(props);
        this.pollingInterval = null;
        this.state = { orders: [], workingOnly: false }
    }

    toggle() {
        this.setState({workingOnly:!this.state.workingOnly})
    }

    componentDidMount() {
        const comp = this;
        this.pollingInterval = setInterval(async () => {
           const orderResponse = await comp.props.coreTradingService.tradingOrdersService().getVenueOrders('bitstamp');
           //console.log('Orders:' + JSON.stringify(orderResponse, null, 2));
           comp.setState({orders: orderResponse.data.orders })
        }, 5000);
        setTimeout(async () => {
            const orderResponse = await comp.props.coreTradingService.tradingOrdersService().getVenueOrders('bitstamp');
            //console.log('Orders:' + JSON.stringify(orderResponse, null, 2));
            comp.setState({orders: orderResponse.data.orders })
        }, 100);
    }

    componentWillUnmount() {
        if (this.pollingInterval !== null) {
            clearInterval(this.pollingInterval);
        }
    }


    render() {
        const comp = this;
        const orders = comp.state.orders
            .filter((order)=> comp.state.workingOnly? (!(order.status === 'canceled' && order.filled_amount > 0) && order.status !== 'closed') :true)
            .map((order) =>
            // Correct! Key should be specified inside the array.
            <tr key={order.orderId} onDoubleClick={(e)=>{alert('hi');e.stopPropagation()}}>
                <td>
                    <span >{order.status === 'canceled' && order.filled_amount > 0 ? 'closed': order.status}</span>
                </td>
                <td>
                    <span >{order.order_type}</span>
                </td>
                <td style={{width:'120px'}}>
                    <AssetIcon style={{float: 'left', marginRight: '12px'}} asset={order.amount_currency} size={'small'} classes={'currency-icon-small'}/>
                    <i style={{float: 'left', marginRight: '10px', marginTop: '3px', fontSize: '16px!important'}} className={'fa fa-arrow-right currency-icon-small'}/>
                    <AssetIcon style={{float: 'left'}} asset={order.cost_currency} size={'small'} classes={'currency-icon-small'}/>

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
                {comp.state.orders.length === 0 ? (
                    <i className={'fa fa-spinner'} />
                ) : (<div className="transaction-table">
                    <div className="table-responsive">
                        <table onClick={(e)=>comp.toggle()} className="table mb-0 table-responsive-sm">
                            <tbody>

                            {orders}


                            </tbody>
                        </table>
                    </div>
                </div>)}

            </div>
        </div>
    }
}