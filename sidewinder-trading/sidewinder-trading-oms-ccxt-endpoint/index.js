'use strict';
const fs = require('fs')
const {SidewinderTaskService} = require("@payburner/sidewinder-tasks-client/src/SidewinderTaskService");
const AWS = require('aws-sdk');
const {Exchanges} = require('./Exchanges')
const config = JSON.parse(fs.readFileSync(process.argv[2]).toString());

AWS.config.update({
    accessKeyId: config.AWS_ACCESS_ID,
    secretAccessKey: config.AWS_ACCESS_KEY,
    region: config.AWS_REGION
});

let client = new AWS.SecretsManager({
    region: "us-west-1"
});

const sidewinderTaskService = new SidewinderTaskService();
sidewinderTaskService.initializeAddress(config.SIDEWINDER_SEED);
const address = sidewinderTaskService.address();
const exchanges = new Exchanges(client, address);
console.log('Target Address: ' + address);


setInterval(async () => {

    let taskRequest = null;
    try {
        taskRequest = await sidewinderTaskService.pullTaskRequest();
        if (typeof taskRequest.error !== 'undefined') {
            console.log('Error Response:' + JSON.stringify(taskRequest, null, 2));
        }
        else if (typeof taskRequest.data.task !== 'undefined') {
            console.log('TaskRequest: ' + taskRequest.data.task.task_type + ' -- ' + JSON.stringify(
                taskRequest.data.task.request_payload, null, 2) );
            if (typeof taskRequest.data.task.request_payload.exchange === 'undefined') {
                console.log('Invalid Task - missing exchange');
                await sidewinderTaskService.pushFailedTaskResponse(taskRequest.data.task.task_id, {error: 'missing exchange property'})
                return;
            }
            let exchange = await exchanges.getExchange(taskRequest.data.task.request_payload.exchange);
            if (exchange === null) {
                console.log('Exchange ' + taskRequest.data.task.request_payload.exchange + ' not found.');
                await sidewinderTaskService.pushFailedTaskResponse(taskRequest.data.task.task_id, {error: 'the exchange was not found'})
                return;
            }
            if (taskRequest.data.task.task_type === 'CCXTFetchBalance') {
                console.log('Fetching ccxt balance');
                let balance = await exchange.fetchBalance();
                console.log('Got balance:' + balance );
                console.log('Send BalanceResponse: ' +
                    JSON.stringify(await sidewinderTaskService.pushTaskResponse(taskRequest.data.task.task_id, balance), null, 2));
            }
            else if (taskRequest.data.task.task_type === 'CCXTFetchOpenOrders') {
                let fetchOpenOrders = await exchange.fetchOpenOrders();
                console.log('Send FetchOpenOrders: ' +
                    JSON.stringify(await sidewinderTaskService.pushTaskResponse(taskRequest.data.task.task_id, fetchOpenOrders), null, 2));
            }
            else if (taskRequest.data.task.task_type === 'CCXTWithdraw') {
                // withdrawal
                let withdraw = await exchange.withdraw(taskRequest.data.task.request_payload.currency, taskRequest.data.task.request_payload.amount, taskRequest.data.task.request_payload.withdrawal_address )

                console.log('Send withdraw: ' +
                    JSON.stringify(await sidewinderTaskService.pushTaskResponse(taskRequest.data.task.task_id, withdraw), null, 2));
            }
            else if (taskRequest.data.task.task_type === 'CCXTFetchDeposits') {
                let fetchDeposits = await exchange.fetchWithdrawals('BTC');
                console.log('Send fetchDeposits: ' +
                    JSON.stringify(await sidewinderTaskService.pushTaskResponse(taskRequest.data.task.task_id, fetchDeposits), null, 2));
            }
            else if (taskRequest.data.task.task_type === 'CCXTMarketOrder') {
                let marketOrder = await exchange.createOrder(taskRequest.data.task.request_payload.symbol, 'market', taskRequest.data.task.request_payload.side, taskRequest.data.task.request_payload.amount)
                console.log('Send cctx market order: ' +
                    JSON.stringify(await sidewinderTaskService.pushTaskResponse(taskRequest.data.task.task_id, marketOrder), null, 2));
            }
            else if (taskRequest.data.task.task_type === 'CCXTBuyMarketOrder') {
                let marketOrder = await exchange.createOrder(taskRequest.data.task.request_payload.symbol, 'market', 'buy', taskRequest.data.task.request_payload.amount)
                console.log('Send cctx buy market order: ' +
                    JSON.stringify(await sidewinderTaskService.pushTaskResponse(taskRequest.data.task.task_id, marketOrder), null, 2));
            }
            else if (taskRequest.data.task.task_type === 'CCXTSellMarketOrder') {
                let marketOrder = await exchange.createOrder(taskRequest.data.task.request_payload.symbol, 'market', 'sell', taskRequest.data.task.request_payload.amount)
                console.log('Send cctx sell market order: ' +
                    JSON.stringify(await sidewinderTaskService.pushTaskResponse(taskRequest.data.task.task_id, marketOrder), null, 2));
            }
            else if (taskRequest.data.task.task_type === 'CCXTGetOrderStatus') {
                let orderData = await exchange.fetchOrder(taskRequest.data.task.request_payload.orderId, taskRequest.data.task.request_payload.symbol);
                console.log('Send cctx fetch order: ' +
                    JSON.stringify(await sidewinderTaskService.pushTaskResponse(taskRequest.data.task.task_id, orderData), null, 2));
            }
            else if (taskRequest.data.task.task_type === 'CCXTFetchDepositAddress') {
                let fetchDepositAddress = await exchange.fetchDepositAddress(taskRequest.data.task.request_payload.currency);
                console.log('Send fetchDepositAddress: ' +
                    JSON.stringify(await sidewinderTaskService.pushTaskResponse(taskRequest.data.task.task_id, fetchDepositAddress), null, 2));
            }
            else if (taskRequest.data.task.task_type === 'CCXTFetchTrades') {
                let myTrades = await exchange.fetchMyTrades(taskRequest.data.task.request_payload.symbol, null, 10);
                console.log('Send myTrades: ' +
                    JSON.stringify(await sidewinderTaskService.pushTaskResponse(taskRequest.data.task.task_id, myTrades), null, 2));
            }
            else if (taskRequest.data.task.task_type === 'CCXTFetchTransactions') {
                let myTransactions = await exchange.fetchTransactions();
                console.log('Send myTransactions: ' +
                    JSON.stringify(await sidewinderTaskService.pushTaskResponse(taskRequest.data.task.task_id, myTransactions), null, 2));
            }
        }
        else {
            console.log('No tasks');
        }
    }
    catch(error) {
        console.log('Caught Error:' + error);
        if (taskRequest !== null) {
            try {
                await sidewinderTaskService.pushFailedTaskResponse(taskRequest.data.task.task_id, {error:error});
            }
            catch(error2) {
                console.log('Error on failing:' + error2);
            }
        }

    }
}, 5000);
