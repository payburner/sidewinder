const AWS = require('aws-sdk');
const uuid4 = require('uuid4');

class AWSTaskServiceStore {

    constructor() {
        this.docClient = new AWS.DynamoDB.DocumentClient();
        this.table = 'sidewinder_tasks'
    }

    async createTask(task) {
        const comp = this;
        return new Promise(async (resolve) => {
            const items = [];
            task.target_address_task_status = task.target_address + '/' + task.task_status;
            task.target_address_task_type_task_status = task.target_address + '/' + task.task_type + '/' + task.task_status
            items.push({
                Put: {
                    TableName: comp.table,
                    Item: task,
                    ConditionExpression: "attribute_not_exists(task_id)"
                }
            });
            comp.docClient.transactWrite({ TransactItems: items }, function (err, data) {
                if (err) {
                    console.log('AWS Transactional Write Error:' + err);
                    console.log('AWS Transactional Write Error:' + JSON.stringify(err, null, 2));
                    if (typeof err.message !== 'undefined') {
                        resolve( {status: 400, error: err.message} );
                    }
                    else {
                        resolve( {status: 400, error: err} );
                    }

                } else {
                    resolve( {status: 200, data: {task:task}} );
                }
            });
        });
    }

    async updateTaskStatus(task_id, target_address, task_status, response_payload ) {
        const comp = this;
        const params = {
            TableName: comp.table,
            KeyConditionExpression: "task_id = :task_id",
            ExpressionAttributeValues: {
                ":task_id": task_id
            }
        };
        console.log('Updating task status:' + task_id + ' ' + target_address + ' ' +
            task_status + ' ' + JSON.stringify(response_payload, null, 2));
        return new Promise((resolve) => {
            const t0 = new Date().getTime();
            if (task_status !== 'RESPONDED' && task_status !== 'FAILED') {
                console.log('Invalid task status');
                return {
                    status: 400, error: 'Invalid task status'
                }
            }
            comp.docClient.query(params, function (err, data) {
                console.log('Query Time Get Task: ' + (new Date().getTime()-t0))
                if (err) {
                    return {
                        status: 404, error: 'The task was not found'
                    }
                } else {
                    if (data.Items.length > 0) {
                        if (data.Items[0].target_address !== target_address) {
                            resolve({
                                status: 403, error: 'No rights to update task'
                            });
                            return;
                        }
                        const items = [];
                        const responded = new Date().getTime();
                        items.push({
                            Update: {
                                TableName: comp.table,
                                Key: {
                                    task_id: data.Items[0].task_id
                                },
                                UpdateExpression: "set task_status = :new_task_status, target_address_task_status = :new_target_address_task_status, target_address_task_type_task_status = :new_target_address_task_type_task_status, response_payload = :response_payload, task_responded = :task_responded",
                                ConditionExpression: "task_status = :old_task_status",
                                ExpressionAttributeValues: {
                                    ":new_task_status" : task_status,
                                    ":old_task_status" : "PENDING",
                                    ":task_responded" : responded,
                                    ":response_payload" : response_payload,
                                    ":new_target_address_task_type_task_status" :
                                        data.Items[0].target_address
                                        + '/' + data.Items[0].task_type
                                        + '/' + task_status,
                                    ":new_target_address_task_status" :
                                        data.Items[0].target_address
                                        + '/' + task_status
                                }
                            }
                        });
                        console.log('Items:' + JSON.stringify(items, null, 2));
                        comp.docClient.transactWrite({ TransactItems: items }, function (err, data2) {
                            console.log('Write returned');
                            if (err) {
                                console.log('AWS Transactional Write Error:' + err);
                                console.log('AWS Transactional Write Error:' + JSON.stringify(err, null, 2));
                                if (typeof err.message !== 'undefined') {
                                    resolve( {status: 400, error: err.message} );
                                }
                                else {
                                    resolve( {status: 400, error: err} );
                                }

                            } else {
                                data.Items[0].response_payload = response_payload;
                                data.Items[0].task_status = task_status;
                                data.Items[0].task_responded = responded;
                                data.Items[0].target_address_task_status = data.Items[0].target_address + '/' + task_status;
                                data.Items[0].target_address_task_type_task_status = data.Items[0].target_address + '/'
                                    +  data.Items[0].task_type + '/' + task_status;

                                resolve( {status: 200, data: {query: {
                                            target_address: target_address
                                        }, task:data.Items[0]}} );
                            }
                        });
                    }
                    else {
                        resolve({
                            status: 404, error: 'The task was not found'
                        });
                    }
                }
            });
        });
    }

    async getTask(task_id) {
        const comp = this;
        const params = {
            TableName: comp.table,
            KeyConditionExpression: "task_id = :task_id",
            ExpressionAttributeValues: {
                ":task_id": task_id
            }
        };
        return new Promise((resolve) => {
            const t0 = new Date().getTime();
            comp.docClient.query(params, function (err, data) {
                console.log('Query Time Get Task: ' + (new Date().getTime()-t0))
                if (err) {
                    return {
                        status: 404, error: 'The task was not found'
                    }
                } else {
                    if (data.Items.length >= 0) {
                        resolve({
                            status: 200,
                                data: {
                            query: {
                                task_id: task_id
                            },
                            task: data.Items[0]
                        }
                        })
                    }
                    else {
                        resolve({
                            status: 404, error: 'The task was not found'
                        });
                    }
                }
            });
        });

    }

    async getTaskForTarget(target_address) {

        const comp = this;
        return new Promise((resolve) => {
            const items = [];

            const params = {
                TableName: comp.table,
                IndexName: 'target_address_task_status-task_created-index',
                KeyConditionExpression: "target_address_task_status = :target_address_task_status",
                ExpressionAttributeValues: {
                    ":target_address_task_status": target_address + '/NEW',
                },
                ScanIndexForward: true
            };

            comp.docClient.query(params, function (err, data) {
                console.log('query returned:' + err);
                if (err) {
                    return {
                        status: 200, data: {
                            query: {
                                target_address: target_address
                            }
                        }
                    }
                } else {
                    console.log('fetching items');
                    const pending = new Date().getTime();
                    if (data.Items.length > 0) {
                        items.push({
                            Update: {
                                TableName: comp.table,
                                Key: {
                                    task_id: data.Items[0].task_id
                                },
                                UpdateExpression: "set task_status = :new_task_status, target_address_task_status = :new_target_address_task_status, target_address_task_type_task_status = :new_target_address_task_type_task_status, task_pending = :task_pending",
                                ConditionExpression: "task_status = :old_task_status",
                                ExpressionAttributeValues: {
                                    ":new_task_status" : "PENDING",
                                    ":old_task_status" : "NEW",
                                    ":task_pending" : pending,
                                    ":new_target_address_task_type_task_status" :
                                        data.Items[0].target_address
                                        + '/' + data.Items[0].task_type
                                        + '/PENDING',
                                    ":new_target_address_task_status" :
                                        data.Items[0].target_address
                                        + '/PENDING'
                                }
                            }
                        });
                        console.log('Items:' + JSON.stringify(items, null, 2));
                        comp.docClient.transactWrite({ TransactItems: items }, function (err, data2) {
                            console.log('Write returned');
                            if (err) {
                                console.log('AWS Transactional Write Error:' + err);
                                console.log('AWS Transactional Write Error:' + JSON.stringify(err, null, 2));
                                if (typeof err.message !== 'undefined') {
                                    resolve( {status: 400, error: err.message} );
                                }
                                else {
                                    resolve( {status: 400, error: err} );
                                }

                            } else {
                                data.Items[0].task_pending = pending;
                                data.Items[0].task_status = 'PENDING';
                                data.Items[0].target_address_task_status = data.Items[0].target_address + '/PENDING';
                                data.Items[0].target_address_task_type_task_status = data.Items[0].target_address + '/'
                                    +  data.Items[0].task_type + '/PENDING';

                                resolve( {status: 200, data: {query: {
                                            target_address: target_address
                                        }, task:data.Items[0]}} );
                            }
                        });
                    }
                    else {
                        resolve({status: 200, data: {
                            query: {
                                target_address: target_address
                            }
                        }});
                    }
                }
            });


        });

    }

    async getTaskForTargetAndType(target_address, task_type) {
        const comp = this;
        return new Promise((resolve) => {
            const items = [];

            const params = {
                TableName: comp.table,
                IndexName: 'target_address_task_status-task_created-index',
                KeyConditionExpression: "target_address_task_type_task_status = :target_address_task_type_task_status",
                ExpressionAttributeValues: {
                    ":target_address_task_type_task_status": target_address + '/' + task_type + '/NEW',
                },
                ScanIndexForward: true
            };

            comp.docClient.query(params, function (err, data) {
                console.log('query returned:' + err);
                if (err) {
                    return {
                        status: 200, data: {
                            query: {
                                target_address: target_address
                            }
                        }
                    }
                } else {
                    const pending = new Date().getTime();
                    console.log('fetching items');
                    if (data.Items.length > 0) {
                        items.push({
                            Update: {
                                TableName: comp.table,
                                Key: {
                                    task_id: data.Items[0].task_id
                                },
                                UpdateExpression: "set task_status = :new_task_status, target_address_task_status = :new_target_address_task_status, target_address_task_type_task_status = :new_target_address_task_type_task_status, task_pending = :task_pending",
                                ConditionExpression: "task_status = :old_task_status",
                                ExpressionAttributeValues: {
                                    ":new_task_status" : "PENDING",
                                    ":task_pending" : pending,
                                    ":old_task_status" : "NEW",
                                    ":new_target_address_task_type_task_status" :
                                        data.Items[0].target_address
                                        + '/' + data.Items[0].task_type
                                        + '/PENDING',
                                    ":new_target_address_task_status" :
                                        data.Items[0].target_address
                                        + '/PENDING'
                                }
                            }
                        });
                        console.log('Items:' + JSON.stringify(items, null, 2));
                        comp.docClient.transactWrite({ TransactItems: items }, function (err, data2) {
                            console.log('Write returned');
                            if (err) {
                                console.log('AWS Transactional Write Error:' + err);
                                console.log('AWS Transactional Write Error:' + JSON.stringify(err, null, 2));
                                if (typeof err.message !== 'undefined') {
                                    resolve( {status: 400, error: err.message} );
                                }
                                else {
                                    resolve( {status: 400, error: err} );
                                }

                            } else {
                                data.Items[0].task_pending = pending;
                                data.Items[0].task_status = 'PENDING';
                                data.Items[0].target_address_task_status = data.Items[0].target_address + '/PENDING';
                                data.Items[0].target_address_task_type_task_status = data.Items[0].target_address + '/'
                                    +  data.Items[0].task_type + '/PENDING';

                                resolve( {status: 200, data: {query: {
                                            target_address: target_address
                                        }, task:data.Items[0]}} );
                            }
                        });
                    }
                    else {
                        resolve({status: 200, data: {
                                query: {
                                    target_address: target_address
                                }
                            }});
                    }
                }
            });


        });
    }
}

module.exports.AWSTaskServiceStore = AWSTaskServiceStore;