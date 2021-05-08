'use strict';
const {TaskServiceHandler} = require("./TaskServiceHandler");
const {TaskServiceExecutor} = require("./TaskServiceExecutor");
const uuid4 = require('uuid4');

const AWS = require('aws-sdk');
module.exports.process = async event => {
    const submitMarketOrder = new TaskServiceHandler();
    const serviceExecutor = new TaskServiceExecutor(submitMarketOrder);
    return await serviceExecutor.execute(event);
};

