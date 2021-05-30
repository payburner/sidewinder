class SidewinderOmsPersistenceService {
    constructor(docClient) {
        this.docClient = docClient;
        this.ACCOUNTS_TABLE = 'sidewinder_oms_external_accounts';
        this.ORDERS_TABLE = 'sidewinder_oms_orders';
        this.DEPOSIT_ADDRESS_TABLE = 'sidewinder_oms_deposit_address'
    }

    getOrdersAtExchange(account_owner_address, exchange) {
        const comp = this;

        const params = {
            TableName: comp.ORDERS_TABLE,
            IndexName: 'index_account_owner_address_exchange_timestamp',
            ScanIndexForward: false,
            Limit: 50,

            KeyConditionExpression: "account_owner_address_exchange = :account_owner_address_exchange",
            ExpressionAttributeValues: {
                ":account_owner_address_exchange": account_owner_address + '/' + exchange
            }
        };
        return new Promise((resolve) => {
            const t0 = new Date().getTime();
            comp.docClient.query(params, function (err, data) {
                console.log('Query Time Get Orders: ' + (new Date().getTime() - t0))
                if (err) {

                    console.log('The orders were not found:' + err);
                    resolve({
                        status: 500, error: 'there was an error retrieving the orders'
                    })
                } else {
                    resolve({
                        status: 200,
                        data: {
                            orders: data.Items
                        }
                    })
                }
            });
        });
    }

    getOrdersForSymbol(account_owner_address, exchange, symbol) {
        const comp = this;

        const params = {
            TableName: comp.ORDERS_TABLE,
            IndexName: 'index_account_owner_address_exchange_symbol_timestamp',
            ScanIndexForward: true,
            Limit: 50,

            KeyConditionExpression: "account_owner_address_exchange_symbol = :account_owner_address_exchange_symbol",
            ExpressionAttributeValues: {
                ":account_owner_address_exchange_symbol": account_owner_address + '/' + exchange + '/' + symbol
            }
        };
        return new Promise((resolve) => {
            const t0 = new Date().getTime();
            comp.docClient.query(params, function (err, data) {
                console.log('Query Time Get Orders: ' + (new Date().getTime() - t0))
                if (err) {

                    console.log('The orders were not found:' + err);
                    resolve({
                        status: 500, error: 'there was an error retrieving the orders'
                    })
                } else {
                    resolve({
                        status: 200,
                        data: {
                            orders: data.Items
                        }
                    })
                }
            });
        });
    }

    getAccount(account_owner_address, exchange, symbol) {
        const comp = this;
        const accountId = account_owner_address + '/' + exchange + '/' + symbol;
        const params = {
            TableName: comp.ACCOUNTS_TABLE,
            KeyConditionExpression: "accountId = :accountId",
            ExpressionAttributeValues: {
                ":accountId": accountId
            }
        };
        return new Promise((resolve) => {
            const t0 = new Date().getTime();
            comp.docClient.query(params, function (err, data) {
                console.log('Query Time Get Order: ' + (new Date().getTime() - t0))
                if (err) {
                    console.log('The account was not found:' + accountId);
                    console.log('The account was not found:' + err);
                    resolve({
                        status: 404, error: 'The account was not found:' + accountId
                    })
                } else {
                    if (data.Items.length >= 0) {
                        console.log('The account was found:' + accountId);
                        resolve({
                            status: 200,
                            data: {
                                account: data.Items[0]
                            }
                        })
                    } else {
                        console.log('The account was found:' + accountId);
                        resolve({
                            status: 404, error: 'The account was not found:' + accountId
                        });
                    }
                }
            });
        });
    }

    getAccounts(account_owner_address, exchange) {
        const comp = this;
        const params = {
            TableName: comp.ACCOUNTS_TABLE,
            IndexName: 'account_owner_address-exchange-index',
            ScanIndexForward: true,
            KeyConditionExpression: "account_owner_address = :account_owner_address and exchange = :exchange",
            ExpressionAttributeValues: {
                ":account_owner_address": account_owner_address,
                ":exchange": exchange
            }
        };
        return new Promise((resolve) => {
            const t0 = new Date().getTime();
            comp.docClient.query(params, function (err, data) {
                console.log('Query Time Get Accounts: ' + (new Date().getTime() - t0))
                if (err) {
                    console.log('The account was not found:' + account_owner_address + ' ' + exchange);
                    console.log('The account was not found:' + err);
                    resolve({
                        status: 404,
                        error: 'The accounts were not found:' + account_owner_address + ' ' + exchange
                    })
                } else {
                    console.log('The accounts were found:' + account_owner_address + ' ' + exchange);
                    resolve({
                        status: 200,
                        data: {
                            accounts: data.Items
                        }
                    })

                }
            });
        });
    }

    getOrder(orderId) {
        const comp = this;
        const params = {
            TableName: comp.ORDERS_TABLE,
            KeyConditionExpression: "orderId = :orderId",
            ExpressionAttributeValues: {
                ":orderId": orderId
            }
        };
        console.log(orderId + ' -- params -- ' + JSON.stringify(params));
        return new Promise((resolve) => {
            const t0 = new Date().getTime();
            comp.docClient.query(params, function (err, data) {
                console.log(orderId + ' -- Query Time Get Order: ' + (new Date().getTime() - t0))
                if (err) {
                    console.log(orderId + ' -- query error -- ' + err);
                    return {
                        status: 404, error: 'The order was not found'
                    }
                } else {
                    console.log(orderId + ' -- items length -- ' + data.Items.length);
                    if (data.Items.length >= 0) {
                        resolve({
                            status: 200,
                            data: {
                                order: data.Items[0]
                            }
                        })
                    } else {
                        console.log(orderId + ' -- no items returned in query');
                        resolve({
                            status: 404, error: 'The order was not found'
                        });
                    }
                }
            });
        });
    }

    saveOrder(order) {
        const comp = this;
        return new Promise(async (resolve) => {
            // Call DynamoDB to add the item to the table

            order.account_owner_address_exchange = order.account_owner_address + '/' + order.exchange;
            order.account_owner_address_exchange_status = order.account_owner_address + '/' + order.exchange + '/' + order.status;
            order.account_owner_address_exchange_symbol = order.account_owner_address + '/' + order.exchange + '/' + order.symbol;
            order.account_owner_address_exchange_symbol_status = order.account_owner_address + '/' + order.exchange + '/' + order.symbol + '/' + order.status;

            const update = {
                Put: {
                    TableName: comp.ORDERS_TABLE,
                    Item: order
                }
            }
            const saved = await comp.transactionalWrite(update);
            console.log('Updated:' + saved);
            if (saved) {
                resolve({status: 200, data: order})
            } else {
                resolve({status: 500, error: 'not saved'})
            }
        })
    }

    updateOrderStatus(orderId, status, status_reason) {
        const comp = this;
        console.log(orderId + ' -- updating order status -- status: ' + status + ', status_reason: ' + status_reason);
        return new Promise(async (resolve, reject) => {
            // Call DynamoDB to add the item to the table

            let getOrderResponse = await comp.getOrder(orderId);
            console.log(orderId + ' -- first get order response status: ' + getOrderResponse.status);

            let count = 0;
            while( getOrderResponse.status !== 200 && count < 10) {
                count++;
                getOrderResponse = await comp.getOrder(orderId);
                console.log(orderId + ' -- ' + count + ' get order response status: ' + getOrderResponse.status);
            }
            if (getOrderResponse.status !== 200) {
                console.log(orderId + ' -- get order response failed: ' + getOrderResponse.status);
                reject({status: 500, error: 'Could not fetch original order'});
                return;
            }

            console.log(orderId + ' -- get order response: ' + JSON.stringify(getOrderResponse, null, 2));


            const order = getOrderResponse.data.order;
            const account_owner_address_exchange_status = order.account_owner_address + '/' + order.exchange + '/' + status;
            const account_owner_address_exchange_symbol_status = order.account_owner_address + '/' + order.exchange + '/' + order.symbol + '/' + status;

            const update = {
                Update: {
                    TableName: comp.ORDERS_TABLE,
                    Key: {
                        orderId: orderId
                    },
                    UpdateExpression: 'SET #status = :status, status_reason = :status_reason, account_owner_address_exchange_status = :account_owner_address_exchange_status, account_owner_address_exchange_symbol_status = :account_owner_address_exchange_symbol_status',
                    'ExpressionAttributeValues': {
                        ':status': status,
                        ':status_reason': status_reason,
                        ':account_owner_address_exchange_status': account_owner_address_exchange_status,
                        ':account_owner_address_exchange_symbol_status': account_owner_address_exchange_symbol_status
                    },
                    'ExpressionAttributeNames': {
                        '#status': 'status'
                    }
                }
            }
            const saved = await comp.transactionalWrite(update);
            console.log('Updated:' + saved);
            if (saved) {
                resolve({
                    status: 200, data: {
                        orderId: orderId,
                        status: status, status_reason: status_reason
                    }
                })
            } else {
                resolve({status: 500, error: 'not saved'})
            }
        })
    }

    saveBalance(account_owner_address, exchange, currency, total, available, locked) {
        const item = {
            accountId: account_owner_address +
                '/' + exchange +
                '/' + currency,
            updated_timestamp: new Date().getTime(),
            account_owner_address: account_owner_address,
            exchange: exchange,
            currency: currency,
            total: total,
            available: available,
            locked: locked
        }
        const comp = this;


        return new Promise(async (resolve) => {
            // Call DynamoDB to add the item to the table
            const update = {
                Put: {
                    TableName: comp.ACCOUNTS_TABLE,
                    Item: item
                }
            }
            const saved = await comp.transactionalWrite(update);
            console.log('Updated:' + saved);
            if (saved) {
                resolve({status: 200, data: item})
            } else {
                resolve({status: 500, error: 'not saved'})
            }
        })
    }

    saveDepositAddress(account_owner_address, exchange, currency, address) {
        const item = {
            accountId: account_owner_address +
                '/' + exchange +
                '/' + currency,
            updated_timestamp: new Date().getTime(),
            account_owner_address: account_owner_address,
            exchange: exchange,
            currency: currency,
            deposit_address: address
        }
        const comp = this;
        return new Promise(async (resolve) => {
            // Call DynamoDB to add the item to the table
            const update = {
                Put: {
                    TableName: comp.DEPOSIT_ADDRESS_TABLE,
                    Item: item
                }
            }
            const saved = await comp.transactionalWrite(update);
            console.log('Updated:' + saved);
            if (saved) {
                resolve({status: 200, data: item})
            } else {
                resolve({status: 500, error: 'not saved'})
            }
        })


    }

    transactionalWrite(update) {
        const self = this;
        return new Promise(async (resolve, reject) => {

            console.log('Items:' + JSON.stringify([update], null, 2));

            console.log('Sending Write Request to DB');
            self.docClient.transactWrite({TransactItems: [update]}, function (err, data) {
                if (err) {
                    console.log('AWS Transactional Write Error:' + err);
                    console.log('AWS Transactional Write Error:' + JSON.stringify(err, null, 2));
                    resolve(false)
                } else {
                    resolve(true);
                }
            });
        });
    }

}

module.exports.SidewinderOmsPersistenceService = SidewinderOmsPersistenceService;
