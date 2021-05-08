const {SidewinderTaskService} = require('./SidewinderTaskService');
var vorpal = require('vorpal')();

const sidewinder = new SidewinderTaskService();

vorpal
    .command('new-address', 'Creates a new sidewinder address', {})
    .action(function (args, callback) {
        this.log(sidewinder.newAddress());
        callback();
    });

vorpal
    .command('load-address <seed>', 'Loads a sidewinder address from its seed', {})
    .action(function (args, callback) {
        this.log(sidewinder.initializeAddress(args.seed));
        callback();
    });

vorpal
    .command('print-seed', 'Loads a sidewinder seed', {})
    .action(function (args, callback) {
        this.log(sidewinder.seed());
        callback();
    });

vorpal
    .command('print-address', 'Print the current sidewinder address', {})
    .action(function (args, callback) {
        this.log(sidewinder.address());
        callback();
    });


vorpal
    .command('push-task-request <target_address> <task_type> <request_payload>', 'Create a new task', {})
    .action(async function (args, callback) {
        const response = await sidewinder.pushTaskRequest(args.target_address, await args.task_type, JSON.parse(args.request_payload));
        console.log('Response :: ' + JSON.stringify(response, null, 2));
        callback();
    });

vorpal
    .command('pull-task-request', 'Pull a task request for a target', {})
    .action(async function (args, callback) {
        const response = await sidewinder.pullTaskRequest();
        console.log('Response :: ' + JSON.stringify(response, null, 2));
        callback();
    });

vorpal
    .command('push-and-await-task <target_address> <task_type> <request_payload>', 'Push and await a task request for a target', {})
    .action(async function (args, callback) {
        const response = await sidewinder.pushAndAwait(args.target_address, await args.task_type, JSON.parse(args.request_payload));
        console.log('Response :: ' + JSON.stringify(response, null, 2));
        callback();
    });

vorpal
    .command('pull-task-request-by-type <task_type>', 'Pull a task request for a target', {})
    .action(async function (args, callback) {

        const response = await sidewinder.pullTaskRequestByType(args.task_type);
        console.log('Response :: ' + JSON.stringify(response, null, 2));
        callback();
    });

vorpal
    .command('push-task-response <task_id> <payload>', 'Push a task response', {})
    .action(async function (args, callback) {

        const response = await sidewinder.pushTaskResponse(args.task_id, JSON.parse(args.payload));
        console.log('Response :: ' + JSON.stringify(response, null, 2));
        callback();
    });

vorpal
    .command('pull-task-status <task_id>', 'Pull a task status', {})
    .action(async function (args, callback) {
        const response = await sidewinder.pullTaskStatus(args.task_id);
        console.log('Response :: ' + JSON.stringify(response, null, 2));
        callback();
    });

vorpal
    .delimiter('sidewinder-tasks-client$')
    .show();