
const {AWSTaskServiceStore} = require('./AWSTaskServiceStore');
const uuid4 = require('uuid4');

class TaskServiceHandler {
    constructor(config) {
        this.config = config;
        this.taskStore = new AWSTaskServiceStore();
    }

    name() {
        return 'TaskServicePushRequest';
    }

    execute(correlation_id, address, request) {
        return new Promise(async (response, error) => {
            if (request.action === 'PushTaskRequest') {

                const task = {
                    task_id: uuid4(),
                    source_address: address,
                    task_status: 'NEW',
                    correlation_id: correlation_id,
                    task_type: request.task_type,
                    task_created: new Date().getTime(),
                    target_address: request.target_address,
                    request_payload: request.request_payload
                };

                const result = await this.taskStore.createTask(task);
                response({statusCode: result.status, body: JSON.stringify(result)});
                return;
            } else if (request.action === 'PullTaskRequest') {
                if (typeof request.task_type !== 'undefined') {
                    const result = await this.taskStore.getTaskForTargetAndType(address, request.task_type);
                    response({statusCode: result.status, body: JSON.stringify(result)});
                    return;
                } else {
                    const result = await this.taskStore.getTaskForTarget(address);
                    response({statusCode: result.status, body: JSON.stringify(result)});
                    return;
                }
            } else if (request.action === 'PushTaskResponse') {
                if (typeof request.task_id !== 'undefined') {
                    let task_status = 'RESPONDED';
                    if (typeof request.task_status !== 'undefined') {
                        task_status = request.task_status;
                    }
                    const result = await this.taskStore
                        .updateTaskStatus(request.task_id, address, task_status, request.response_payload);
                    response({statusCode: result.status, body: JSON.stringify(result)});
                    return;
                } else {
                    response({statusCode: 400, error: "Please specify the task id"});
                    return;
                }
            } else if (request.action === 'PullTaskStatus') {
                if (typeof request.task_id !== 'undefined') {
                    const result = await this.taskStore.getTask(request.task_id);
                    response({statusCode: result.status, body: JSON.stringify(result)});
                    return;
                } else {
                    response({statusCode: 400, error: "Please specify the task id"});
                    return;
                }
            } else {
                response({
                    statusCode: 400,
                    body: JSON.stringify({status: 400, error: 'Unknown action'})
                });
                return;
            }

        });
    }
}

module.exports.TaskServiceHandler = TaskServiceHandler;