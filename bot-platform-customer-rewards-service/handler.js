'use strict';
const {BotCore} = require( "@payburner/sidewinder-service/BotCore" );
const {GlobalResponderClient} = require( "@payburner/sidewinder-service/GlobalResponderClient" );
const {BotBusinessLogic} = require("./BotBusinessLogic");
const AWS = require('aws-sdk');
module.exports.process = async event => {

    const botCore = new BotCore();
    const decodedRequest = botCore.decodeAndVerify( event );
    if (decodedRequest.status !== 200) {
        return {
            statusCode: decodedRequest.status, body: JSON.stringify(decodedRequest)
        };
    }
    console.log('address:' + decodedRequest.data.address);
    let configResponse = await botCore.getConfig(decodedRequest.data.address);
    if (configResponse.status !== 200) {
        return {
            statusCode: configResponse.status, body: JSON.stringify(configResponse)
        };
    }

    const globalResponderClient = new GlobalResponderClient(configResponse.data);
    const botBusinessLogic = new BotBusinessLogic(configResponse.data, globalResponderClient);
    await botBusinessLogic.init();

    const response = await botBusinessLogic.transferFundsToCustomer( decodedRequest.data.payload );
    return {
        statusCode: configResponse.status, body: JSON.stringify(response)
    };

};

