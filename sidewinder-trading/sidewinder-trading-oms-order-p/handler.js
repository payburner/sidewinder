'use strict';
const AWS = require('aws-sdk');
const {SidewinderOmsPersistenceService} = require("@payburner/sidewinder-trading-oms-p/src/SidewinderOmsPersistenceService");

module.exports.process = async event => {

    const stepfunctions = new AWS.StepFunctions();
    const docClient = new AWS.DynamoDB.DocumentClient();
    const p = new SidewinderOmsPersistenceService( docClient );

    console.log('Event:' + JSON.stringify(event, null, 2));

    const omsOrderId = event.Input.OrderResponse.request_payload.omsOrderId;
    const exchange = event.Input.OrderResponse.request_payload.exchange;
    const side = event.Input.OrderResponse.request_payload.side;
    const amount = event.Input.OrderResponse.request_payload.amount;
    const address = event.Input.OrderResponse.target_address;
    const orderId = event.Input.OrderResponse.request_payload.orderId;
    const symbol = event.Input.OrderResponse.response_payload.symbol;
    const fee = event.Input.OrderResponse.response_payload.fee.cost;
    const feeCurrency = event.Input.OrderResponse.response_payload.fee.currency;
    const cost = event.Input.OrderResponse.response_payload.cost;
    const filledAmount = event.Input.OrderResponse.response_payload.filled;
    const remainingAmount = event.Input.OrderResponse.response_payload.remaining;
    const status = event.Input.OrderResponse.response_payload.status;
    const averagePrice = event.Input.OrderResponse.response_payload.average;
    const lastTradeTimestamp = event.Input.OrderResponse.response_payload.lastTradeTimestamp;

    const symbolTokens = symbol.split('/');

    const costCurrency = symbolTokens[1];
    const amountCurrency = symbolTokens[0];

    const netCostCurrency = side === 'buy' ? cost*-1 : cost;
    const netAmountCurrency = side === 'buy' ? amount : amount*-1;
    const order = {
        orderId : omsOrderId,
        account_owner_address: address,
        exchange: exchange,
        side: side,
        amount: amount,
        order_type: 'market',
        update_timestamp : new Date().getTime(),
        last_trade_timestamp: lastTradeTimestamp,
        symbol: symbol,
        exchangeOrderId: orderId,
        fee: fee,
        fee_currency: feeCurrency,
        cost: cost,
        filled_amount: filledAmount,
        remaining_amount: remainingAmount,
        status: status,
        average_price: averagePrice,
        cost_currency : costCurrency,
        amount_currency : amountCurrency,
        net_cost_currency : netCostCurrency,
        net_amount_currency : netAmountCurrency
    }

    console.log('Order:' + JSON.stringify(order, null, 2));
    const saveOrderResponse = await p.saveOrder( order );
    console.log('Save Order Response:' + JSON.stringify(saveOrderResponse, null, 2));
    const params = {
        output: JSON.stringify({}, null, 2),
        taskToken: event.TaskToken
    };

    return new Promise((resolve) => {
        stepfunctions.sendTaskSuccess(params, (err, data) => {
            if (err) {
                console.error(err.message);
                resolve(err.message);
                return;
            }
            console.log(data);
            resolve({
                statusCode: 200, body: JSON.stringify({status:200,data:{}})
            });
        });
    })

};

