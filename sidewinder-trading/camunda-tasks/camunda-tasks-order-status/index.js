const {Client, logger, Variables, BasicAuthInterceptor} = require("camunda-external-task-client-js");
const AWS = require('aws-sdk');
const {SidewinderTaskService} = require("@payburner/sidewinder-tasks-client/src/SidewinderTaskService");

const {SidewinderOmsPersistenceService} = require("@payburner/sidewinder-trading-oms-p/src/SidewinderOmsPersistenceService");
const fs = require('fs');

const pConfig = JSON.parse(fs.readFileSync(process.argv[2]).toString());

const basicAuthentication = new BasicAuthInterceptor({
    username: pConfig.CAMUNDA_USER,
    password: pConfig.CAMUNDA_PASSWORD
});

const config = { interceptors: basicAuthentication, baseUrl: "https://oms.payburner.com/engine-rest", use: logger };

// create a Client instance with custom configuration
const client = new Client(config);

AWS.config.update({
    accessKeyId: pConfig.AWS_ACCESS_ID,
    secretAccessKey: pConfig.AWS_ACCESS_KEY,
    region: pConfig.AWS_REGION
});
const sidewinder = new SidewinderTaskService();
sidewinder.initializeAddress(pConfig.SIDEWINDER_SEED);
const docClient = new AWS.DynamoDB.DocumentClient();
const p = new SidewinderOmsPersistenceService(docClient);

client.subscribe("CCXTCheckOrderStatus", async function ({task, taskService}) {
    console.log('TASK:' + JSON.stringify(task.variables.getAll(), null, 2));
    const input = task.variables.getAll();
    const taskPushResponse = await sidewinder.pushAndAwait(input.target_address, 'CCXTGetOrderStatus', {
        orderId: input.exchangeOrderId,
        exchange: input.exchange,
        omsOrderId: input.omsOrderId
    });
    console.log('Task push response:' + JSON.stringify(taskPushResponse, null, 2));
    const orderResponse = taskPushResponse.data.task;
    if (orderResponse.task_status === 'FAILED') {
        // Create some variables

        const processVariables = new Variables().set("status", 'NOT_DONE');
        // set a local variable 'winningDate'
        const localVariables = new Variables();
        await taskService.complete(task, processVariables, localVariables);
        return;
    }
    try {
        const getOrderResponse = await p.getOrder(input.omsOrderId);
        console.log('ORDER:' + JSON.stringify(getOrderResponse, null, 2));
        const order = getOrderResponse.data.order;
        if (typeof orderResponse.response_payload.fee !== 'undefined') {
            order.fee = Math.round((orderResponse.response_payload.fee.cost + Number.EPSILON) * 100) / 100 ;
            order.fee_currency = orderResponse.response_payload.fee.currency;
        }

        if (order.order_type === 'instant') {
            order.cost = orderResponse.response_payload.filled;
            order.filled_amount = Math.round(( orderResponse.response_payload.cost  + Number.EPSILON) * 100) / 100;
            order.remaining_amount = order.amount - order.filled_amount;
            if (typeof order.fee !== 'undefined') {
                order.remaining_amount = order.remaining_amount - order.fee;
                if (order.remaining_amount < 0) {
                    order.remaining_amount = 0;
                }
            }
            if (order.filled_amount > 0) {
                order.last_trade_timestamp = orderResponse.response_payload.lastTradeTimestamp;
                order.net_amount_currency = order.side === 'buy' ? order.amount * -1 : order.amount;
                order.net_cost_currency = order.side === 'buy' ? order.cost : order.cost * -1;
                // @TODO FIX ME -- should be the opposite of the average.
                order.average_price = orderResponse.response_payload.average;
            }
        }
        else {
            order.cost = orderResponse.response_payload.cost;
            order.filled_amount = orderResponse.response_payload.filled;
            order.remaining_amount = orderResponse.response_payload.remaining;
            if (order.filled_amount > 0) {
                order.last_trade_timestamp = orderResponse.response_payload.lastTradeTimestamp;
                order.net_cost_currency = order.side === 'buy' ? order.cost * -1 : order.cost;
                order.net_amount_currency = order.side === 'buy' ? order.amount : order.amount * -1;
                order.average_price = orderResponse.response_payload.average;
            }
        }
        order.status = orderResponse.response_payload.status;

        console.log('Order to Update:' + JSON.stringify(order, null, 2));
        const updateOrderResponse = await p.saveOrder(order);
        if (order.remaining_amount === 0 || order.status === 'closed' || order.status === 'canceled') {
            const processVariables = new Variables().set("status", 'DONE');
            // set a local variable 'winningDate'
            const localVariables = new Variables();
            await taskService.complete(task, processVariables, localVariables);
        }
        else {
            const processVariables = new Variables().set("status", 'NOT_DONE');
            // set a local variable 'winningDate'
            const localVariables = new Variables();
            await taskService.complete(task, processVariables, localVariables);
        }

    } catch (error) {
        console.log('ERRRROR:' + error);
        console.log( error);
        await taskService.handleBpmnError(task, "save_failed", JSON.stringify(error), new Variables());
    }
});