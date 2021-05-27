import React from 'react';

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

    render() {
        const comp = this;
        const orders = comp.state.orders.map((order) =>
            // Correct! Key should be specified inside the array.
            <tr key={order.orderId}>
                <td><span className="sold-thumb"><i
                    className="fa fa-arrow-down"></i></span>
                </td>

                <td>
                    <span className="badge badge-danger">Sold</span>
                </td>
                <td>
                    <i className="cc BTC"></i> BTC
                </td>
                <td>
                    {order.orderId}
                </td>
                <td className="text-danger">-0.000242 BTC</td>
                <td>-0.125 USD</td>
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