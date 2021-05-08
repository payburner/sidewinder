'use strict';
const {BotCore} = require( "@payburner/sidewinder-service/BotCore" );
const {BotEventsDriver} = require( "@payburner/sidewinder-service/BotEventsDriver" );
const {GlobalResponderClient} = require( "@payburner/sidewinder-service/GlobalResponderClient" );
const {BotBusinessLogic} = require("./BotBusinessLogic");
const AWS = require('aws-sdk');
module.exports.process = async event => {

    console.log('Getting started');
    const botCore = new BotCore();
    const decodedResponse = botCore.decodeAndVerify( event );
    if (decodedResponse.status !== 200) {
        return {
            statusCode: decodedResponse.status, body: JSON.stringify(decodedResponse)
        };
    }

    let configResponse = await botCore.getConfig(decodedResponse.data.address);
    if (configResponse.status !== 200) {
        return {
            statusCode: configResponse.status, body: JSON.stringify(configResponse)
        };
    }

    const normalizedEvents = decodedResponse.data.payload.events;
    const globalResponderClient = new GlobalResponderClient(configResponse.data);

    const botBusinessLogic = new BotBusinessLogic(configResponse.data, globalResponderClient);
    await botBusinessLogic.init();

    const botEventsDriver = new BotEventsDriver(configResponse.data, new AWS.DynamoDB.DocumentClient());
    return await botEventsDriver.doProcess(normalizedEvents, botBusinessLogic);

};

