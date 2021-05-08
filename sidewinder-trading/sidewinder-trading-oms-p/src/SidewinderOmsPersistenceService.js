class SidewinderOmsPersistenceService {
    constructor( docClient ) {
        this.docClient = docClient;
        this.ACCOUNTS_TABLE = 'sidewinder_oms_external_accounts';
        this.ORDERS_TABLE = 'sidewinder_oms_orders';
        this.DEPOSIT_ADDRESS_TABLE = 'sidewinder_oms_deposit_address'
    }

    getOrder( orderId ) {
        const comp = this;
        const params = {
            TableName: comp.ORDERS_TABLE,
            KeyConditionExpression: "orderId = :orderId",
            ExpressionAttributeValues: {
                ":orderId": orderId
            }
        };
        return new Promise((resolve) => {
            const t0 = new Date().getTime();
            comp.docClient.query(params, function (err, data) {
                console.log('Query Time Get Order: ' + (new Date().getTime()-t0))
                if (err) {
                    return {
                        status: 404, error: 'The order was not found'
                    }
                } else {
                    if (data.Items.length >= 0) {
                        resolve({
                            status: 200,
                            data: {
                                order: data.Items[0]
                            }
                        })
                    }
                    else {
                        resolve({
                            status: 404, error: 'The order was not found'
                        });
                    }
                }
            });
        });
    }

    saveOrder( order ) {
        const comp = this;
        return new Promise(async (resolve) => {
            // Call DynamoDB to add the item to the table
            const update = {
                Put: {
                    TableName: comp.ORDERS_TABLE,
                    Item: order
                }
            }
            const saved = await comp.transactionalWrite( update );
            console.log('Updated:' + saved);
            if (saved) {
                resolve({status:200, data: order})
            }
            else {
                resolve({status:500, error: 'not saved'})
            }
        })
    }

    updateOrderStatus( orderId, status, status_reason ) {
        const comp = this;
        return new Promise(async (resolve) => {
            // Call DynamoDB to add the item to the table
            const update = {
                Update: {
                    TableName: comp.ORDERS_TABLE,
                    Key: {
                        orderId: orderId
                    },
                    UpdateExpression: 'SET #status = :status, status_reason = :status_reason',
                    'ExpressionAttributeValues': {
                        ':status' : status,
                        ':status_reason' : status_reason
                    },
                    'ExpressionAttributeNames' : {
                        '#status' : 'status'
                    }
                }
            }
            const saved = await comp.transactionalWrite( update );
            console.log('Updated:' + saved);
            if (saved) {
                resolve({status:200, data: {
                    orderId: orderId,
                        status: status, status_reason: status_reason
                    }})
            }
            else {
                resolve({status:500, error: 'not saved'})
            }
        })
    }

    saveBalance( account_owner_address, exchange, currency, total, available, locked ) {
        const item = {
            accountId : account_owner_address +
                '/' + exchange+
                '/' + currency,
            updated_timestamp : new Date().getTime(),
            account_owner_address: account_owner_address,
            exchange : exchange,
            currency : currency,
            total: total,
            available : available,
            locked : locked
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
            const saved = await comp.transactionalWrite( update );
            console.log('Updated:' + saved);
            if (saved) {
                resolve({status:200, data:item})
            }
            else {
                resolve({status:500, error: 'not saved'})
            }
        })
    }

    saveDepositAddress( account_owner_address, exchange, currency, address ) {
        const item = {
            accountId : account_owner_address +
                '/' + exchange+
                '/' + currency,
            updated_timestamp : new Date().getTime(),
            account_owner_address: account_owner_address,
            exchange : exchange,
            currency : currency,
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
            const saved = await comp.transactionalWrite( update );
            console.log('Updated:' + saved);
            if (saved) {
                resolve({status:200, data:item})
            }
            else {
                resolve({status:500, error: 'not saved'})
            }
        })



    }

    transactionalWrite( update ) {
        const self = this;
        return new Promise( async (resolve, reject) => {

            console.log('Items:' + JSON.stringify([update], null, 2));

            console.log('Sending Write Request to DB');
            self.docClient.transactWrite({ TransactItems: [update] }, function (err, data) {
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
