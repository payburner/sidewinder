const AWS = require('aws-sdk');
const uuid4 = require('uuid4');

class TaskServiceStore {
    constructor() {
        this.tasks = {};
        this.targets = {}
    }

    async createTask(task) {
        if (typeof this.tasks[task.task_id] === 'undefined') {
            this.tasks[task.task_id] = task;
            if (typeof this.targets[task.target_address] === 'undefined') {
                this.targets[task.target_address] = [];
            }
            this.targets[task.target_address].push(task);
            return {status: 200, data: {task:task}}
        } else {
            return {status: 400, error: 'Task with id already exists.'}
        }
    }

    async updateTaskStatus(task_id, target_address, task_status, response_payload ) {
        const result = await this.getTask(task_id);
        if (result.status !== 200) {
            return result;
        }
        if (result.data.task.target_address !== target_address) {
            return {
                status: 403, error: 'Not authorized to update.'
            }
        }
        if (result.data.task.task_status !== 'PENDING') {
            return {
                status: 400, error: 'The task is not pending'
            }
        }
        result.data.task.task_status = task_status;
        result.data.task.response_payload = response_payload;
        return result;
    }

    async getTask(task_id) {
        if (typeof this.tasks[task_id] !== 'undefined') {
            return {
                status: 200,
                data: {
                    query: {
                        task_id: task_id
                    },
                    task: this.tasks[task_id]
                }
            }
        } else {
            return {status: 404, error: 'Task with id not found.'}
        }
    }

    async getTaskForTarget(target_address) {
        if (typeof this.targets[target_address] === 'undefined') {
            return {
                status: 200,
                data: {
                    query: {
                        target_address: target_address
                    }
                }
            }
        } else {

            const filtered = this.targets[target_address].filter((task) => {
                return task.task_status === 'NEW'
            });
            if (filtered.length > 0) {
                filtered[0].task_status = 'PENDING';
                return {
                    status: 200,
                    data: {
                        query: {
                            target_address: target_address
                        },
                        task: filtered[0]
                    }
                }
            }
            return {
                status: 200,
                data: {
                    query: {
                        target_address: target_address
                    }
                }
            }
        }
    }

    async getTaskForTargetAndType(target_address, task_type) {
        if (typeof this.targets[target_address] === 'undefined') {
            return {
                status: 200, data: {
                    query: {
                        target_address: target_address,
                        task_type: task_type
                    }
                }
            }
        } else {

            const filtered = this.targets[target_address].filter((task) => {
                return task.task_status === 'NEW' && task.task_type === task_type
            });
            if (filtered.length > 0) {
                filtered[0].task_status = 'PENDING';
                return {
                    status: 200,
                    data: {
                        query: {
                            target_address: target_address,
                            task_type: task_type
                        },
                        task: filtered[0]
                    }
                }
            }
            return {
                status: 200,
                data: {
                    query: {
                        target_address: target_address,
                        task_type: task_type
                    }
                }
            }
        }
    }
}

module.exports.TaskServiceStore = TaskServiceStore;