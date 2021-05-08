const {Api} = require('./Api');
const axios = require('axios');

class SidewinderTaskService {
    constructor() {
        this.api = new Api();
    }

    newAddress() {
        this.api.newAddress();
        return this.api.getAddress();
    }

    initializeAddress(seed) {
        this.api.initializeAddress(seed);
        return this.api.getAddress();
    }

    seed() {
        return this.api.seed;
    }

    address() {
        return this.api.getAddress();
    }

    execute(request) {
        return new Promise(async (resolve) => {
            try {
                const {data: result} = await axios.post(
                    'https://96lrqqry49.execute-api.us-west-1.amazonaws.com/dev/process',
                    this.api.signTokenCreateRequest(request), {
                        headers: {'Content-Type': 'application/json'}
                    });
                resolve(result);
            } catch (error) {
                resolve({status: 400, error: error})
            }
        });
    }

    async pushTaskRequest(target_address, task_type, request_payload) {
        const request = {
            action: 'PushTaskRequest',
            target_address: target_address,
            task_type: task_type,
            request_payload: request_payload
        };
        return this.execute(request);
    }

    async pullTaskRequest() {
        const request = {
            action: 'PullTaskRequest'
        };
        return this.execute(request);
    }
    async pullTaskRequestByType( task_type ) {
        const request = {
            action: 'PullTaskRequest',
            task_type: task_type
        };
        return this.execute(request);
    }
    async pushTaskResponse( task_id, response_payload ) {
        const request = {
            action: 'PushTaskResponse',
            task_id: task_id,
            response_payload: response_payload
        };
        return this.execute(request);
    }
    async pushFailedTaskResponse( task_id, response_payload ) {
        const request = {
            action: 'PushTaskResponse',
            task_id: task_id,
            task_status : 'FAILED',
            response_payload: response_payload
        };
        return this.execute(request);
    }
    async pullTaskStatus( task_id ) {
        const request = {
            action: 'PullTaskStatus',
            task_id: task_id
        };
        return this.execute(request);
    }

    async pushAndAwait(target_address, task_type, request_payload) {
        const taskResponse = await this.pushTaskRequest(target_address, task_type, request_payload);
        if (taskResponse.status !== 200) {
            return taskResponse;
        }
        return new Promise((resolve) => {
            let count = 0;
            const interval =setInterval(async () => {
                console.log('Polling task status:' + taskResponse.data.task.task_id);
                const taskStatus = await this.pullTaskStatus(taskResponse.data.task.task_id);
                if (taskStatus.status !== 200) {
                    clearInterval(interval);
                    resolve(taskStatus);
                }
                else if (taskStatus.data.task.task_status !== 'PENDING' && taskStatus.data.task.task_status !== 'NEW') {
                    clearInterval(interval);
                    resolve(taskStatus);
                }
                count++;
                if (count > 10) {
                    clearInterval(interval);
                    resolve({status: 400, error: 'Timed out'})
                }
            }, 5000);
        });
    }
}

module.exports.SidewinderTaskService = SidewinderTaskService;
