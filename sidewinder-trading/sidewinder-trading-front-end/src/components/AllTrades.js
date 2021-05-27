import React from 'react';

export default class AllTrades extends React.Component {
    constructor(props) {
        super(props);
        this.pollingInterval = null;
    }

    componentDidMount() {
        const comp = this;
        this.pollingInterval = setInterval(async () => {
           const orders = comp.props.coreTradingService.tradingOrdersService().getVenueOrders('bitstamp');
           console.log('Orders:' + JSON.stringify(orders, null, 2));
        }, 5000);
    }

    componentWillUnmount() {
        if (this.pollingInterval !== null) {
            clearInterval(this.pollingInterval);
        }
    }

    render() {
        return <div className="card">
            <div className="card-header border-0">
                <h4 className="card-title">All Trades</h4>
            </div>
            <div className="card-body pt-0">
                <div className="transaction-table">
                    <div className="table-responsive">
                        <table className="table mb-0 table-responsive-sm">
                            <tbody>
                            <tr>
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
                                    Using - Bank *******5264
                                </td>
                                <td className="text-danger">-0.000242 BTC</td>
                                <td>-0.125 USD</td>
                            </tr>
                            <tr>
                                <td><span className="buy-thumb"><i
                                    className="fa fa-arrow-up"></i></span>
                                </td>
                                <td>
                                    <span className="badge badge-success">Buy</span>
                                </td>
                                <td>
                                    <i className="cc LTC"></i> LTC
                                </td>
                                <td>
                                    Using - Card *******8475
                                </td>
                                <td className="text-success">-0.000242 BTC</td>
                                <td>-0.125 USD</td>
                            </tr>
                            <tr>
                                <td><span className="sold-thumb"><i
                                    className="fa fa-arrow-down"></i></span>
                                </td>
                                <td>
                                    <span className="badge badge-danger">Sold</span>
                                </td>
                                <td>
                                    <i className="cc XRP"></i> XRP
                                </td>
                                <td>
                                    Using - Card *******8475
                                </td>
                                <td className="text-danger">-0.000242 BTC</td>
                                <td>-0.125 USD</td>
                            </tr>
                            <tr>
                                <td><span className="buy-thumb"><i
                                    className="fa fa-arrow-up"></i></span>
                                </td>
                                <td>
                                    <span className="badge badge-success">Buy</span>
                                </td>
                                <td>
                                    <i className="cc DASH"></i> DASH
                                </td>
                                <td>
                                    Using - Card *******2321
                                </td>
                                <td className="text-success">-0.000242 BTC</td>
                                <td>-0.125 USD</td>
                            </tr>
                            <tr>
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
                                    Using - Card *******2321
                                </td>
                                <td className="text-danger">-0.000242 BTC</td>
                                <td>-0.125 USD</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    }
}