'use strict';
const {BotCore} = require( "@payburner/sidewinder-service/BotCore" );
const {BotEventsDriver} = require( "@payburner/sidewinder-service/BotEventsDriver" );
const {TwitterResponderClient} = require( "@payburner/sidewinder-service/TwitterResponderClient" );
const {BotBusinessLogic} = require("./BotBusinessLogic");
const AWS = require('aws-sdk');
module.exports.process = async event => {

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
    const twitterResponderClient = new TwitterResponderClient(configResponse.data);

    const botBusinessLogic = new BotBusinessLogic(configResponse.data, twitterResponderClient);

    const botEventsDriver = new BotEventsDriver(configResponse.data, new AWS.DynamoDB.DocumentClient());
    return await botEventsDriver.doProcess(normalizedEvents, botBusinessLogic);

};

