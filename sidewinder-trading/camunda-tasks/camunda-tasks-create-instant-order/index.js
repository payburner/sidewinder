const {
    Client,
    logger,
    Variables,
    BasicAuthInterceptor
} = require("camunda-external-task-client-js");
const AWS = require('aws-sdk');
const {SidewinderOmsPersistenceService} = require("@payburner/sidewinder-trading-oms-p/src/SidewinderOmsPersistenceService");
const {SidewinderTaskService} = require("@payburner/sidewinder-tasks-client/src/SidewinderTaskService");

const fs = require('fs');
const uuid4 = require('uuid4');

const pConfig = JSON.parse(fs.readFileSync(process.argv[2]).toString());

const basicAuthentication = new BasicAuthInterceptor({
    username: pConfig.CAMUNDA_USER,
    password: pConfig.CAMUNDA_PASSWORD
});

// configuration for the Client:
//  - 'baseUrl': url to the Process Engine
//  - 'logger': utility to automatically log important events
const config = {
    interceptors: basicAuthentication,
    baseUrl: "https://oms.payburner.com/engine-rest",
    use: logger
};

// create a Client instance with custom configuration
const client = new Client(config);

AWS.config.update({
    accessKeyId: pConfig.AWS_ACCESS_ID,
    secretAccessKey: pConfig.AWS_ACCESS_KEY,
    region: pConfig.AWS_REGION
});
const docClient = new AWS.DynamoDB.DocumentClient();
const p = new SidewinderOmsPersistenceService(docClient);

const sidewinder = new SidewinderTaskService();
sidewinder.initializeAddress(pConfig.SIDEWINDER_SEED);

// susbscribe to the topic: 'creditScoreChecker'
client.subscribe("CreateInstantOrder", async function ({task, taskService}) {
    console.log('TASK:' + JSON.stringify(task.variables.getAll(), null, 2));
    const input = task.variables.getAll();

    let sideVar = 'side';
    let symbolVar = 'symbol;'
    if (typeof input.loopCounter !== 'undefined') {
        sideVar = 'side-' + input.loopCounter;
        symbolVar = 'symbol-' + input.loopCounter;
    }

    const exchange = input.exchange;
    const side = input[sideVar];
    const amount = input.amount;
    const address = input.target_address;
    const orderId = uuid4();
    const symbol = input[symbolVar];
    const status = 'pending';
    const symbolTokens = symbol.split('/');
    const costCurrency = symbolTokens[0];
    const amountCurrency = symbolTokens[1];

    const order = {
        orderId: orderId,
        account_owner_address: address,
        exchange: exchange,
        side: side,
        amount: amount,
        order_type: 'instant',
        update_timestamp: new Date().getTime(),
        symbol: symbol,
        filled_amount: 0,
        remaining_amount: 0,
        status: status,
        cost_currency: costCurrency,
        amount_currency: amountCurrency,
    }
    console.log('Order:' + JSON.stringify(order, null, 2));
    const saveOrderResponse = await p.saveOrder(order);
    console.log('OrderResponse:' + JSON.stringify(saveOrderResponse, null, 2));

    const pushInstantOrderResponse = await sidewinder.pushAndAwait(input.target_address, 'CCXTInstantOrder', {
        exchange: exchange,
        omsOrderId: order.orderId,
        side: side,
        amount: amount,
        symbol: symbol
    });
    console.log('CCXTInstantOrder response:' + JSON.stringify(pushInstantOrderResponse, null, 2));

    const orderResponse = pushInstantOrderResponse.data.task;
    if (orderResponse.task_status === 'FAILED') {
        try {
            // Create some variables
            const variables = new Variables().set('date', new Date());
            const reason = JSON.stringify(orderResponse.response_payload.error);
            // Handle a BPMN Failure
            const saveOrderResponse = await p.updateOrderStatus( orderId, "submit_failed", reason);
            console.log('Updated Failed Order Response:' + JSON.stringify(saveOrderResponse, null, 2));
            await taskService.handleBpmnError(task, "submit_failed", reason, variables);
            console.log('ERROR');
            return;
        }
        catch(error) {
            console.log('ERROR');
            console.log('error:' + error);
            console.log(error);

            await taskService.handleBpmnError(task, "submit_failed", JSON.stringify(error), new Variables());

        }

    }
    try {
        order.exchangeOrderId = orderResponse.response_payload.id;
        if (typeof orderResponse.response_payload.fee !== 'undefined') {
            order.fee = Math.round((orderResponse.response_payload.fee.cost + Number.EPSILON) * 100) / 100 ;
            order.fee_currency = orderResponse.response_payload.fee.currency;
        }

        order.cost = orderResponse.response_payload.filled;
        order.filled_amount = Math.round((orderResponse.response_payload.cost + Number.EPSILON) * 100) / 100 ;
        order.remaining_amount = order.amount - order.filled_amount;
        if (typeof order.fee !== 'undefined') {
            order.remaining_amount = order.remaining_amount - order.fee;
            if (order.remaining_amount < 0) {
                order.remaining_amount = 0;
            }
        }
        if (order.filled_amount > 0) {
            order.last_trade_timestamp = orderResponse.response_payload.lastTradeTimestamp;
            order.net_amount_currency = side === 'buy' ?  amount * -1 : amount;
            order.net_cost_currency = side === 'buy' ? order.cost : order.cost * -1;
            // TODO FIX ME
            order.average_price = orderResponse.response_payload.average;
        }
        order.status = 'submitted';

        console.log('Order to Update:' + JSON.stringify(order, null, 2));
        const updateOrderResponse = await p.saveOrder(order);
        console.log('Update Order Response:' + JSON.stringify(updateOrderResponse, null, 2));
        const processVariables = new Variables().set("omsOrderId", orderId).set("exchangeOrderId", order.exchangeOrderId);
        // set a local variable 'winningDate'
        const localVariables = new Variables();
        await taskService.complete(task, processVariables, localVariables);
    } catch (error) {
        console.log('ERROR');
        console.log('error:' + error);
        console.log(error);

        await taskService.handleBpmnError(task, "save_failed", JSON.stringify(error), new Variables());

    }
});