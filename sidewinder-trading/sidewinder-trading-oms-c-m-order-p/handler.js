'use strict';
const AWS = require('aws-sdk');
const {SidewinderOmsPersistenceService} = require("@payburner/sidewinder-trading-oms-p/src/SidewinderOmsPersistenceService");
const uuid4 = require('uuid4');

module.exports.process = async event => {

    const stepfunctions = new AWS.StepFunctions();
    const docClient = new AWS.DynamoDB.DocumentClient();
    const p = new SidewinderOmsPersistenceService( docClient );

    console.log('Event:' + JSON.stringify(event, null, 2));

    const exchange = event.Input.exchange;
    const side = event.Input.side;
    const amount = event.Input.amount;
    const address = event.Input.target_address;
    const orderId = uuid4();
    const symbol = event.Input.symbol;

    const status = 'pending';

    const symbolTokens = symbol.split('/');

    const costCurrency = symbolTokens[1];
    const amountCurrency = symbolTokens[0];

    const order = {
        orderId : orderId,
        account_owner_address: address,
        exchange: exchange,
        side: side,
        amount: amount,
        order_type: 'market',
        update_timestamp : new Date().getTime(),
        symbol: symbol,
        filled_amount: 0,
        remaining_amount: 0,
        status: status,
        cost_currency : costCurrency,
        amount_currency : amountCurrency,
    }
    console.log('Order:' + JSON.stringify(order, null, 2));
    const saveOrderResponse = await p.saveOrder( order );
    console.log('Save Order Response:' + JSON.stringify(saveOrderResponse, null, 2));
    const params = {
        output: JSON.stringify({
            omsOrderId: omsOrderId
        }, null, 2),
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

