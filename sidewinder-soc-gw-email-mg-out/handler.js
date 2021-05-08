'use strict';
const {BotCore} = require( "@payburner/sidewinder-service/BotCore" );
const {PlatformService} = require( "@payburner/sidewinder-service/PlatformService" );
const {MailgunResponder} = require("./MailgunResponder");
const uuid4 = require('uuid4');

const AWS = require('aws-sdk');
module.exports.process = async event => {

    let correlation_id = uuid4();
    if (typeof event.body.correlation_id !== 'undefined' && event.body.correlation_id !== null) {
        correlation_id = event.body.correlation_id;
    }
    console.log('#--> GW-OUT-REQUEST-IN: PRE-DECODE');


    const botCore = new BotCore();
    const decodedResponse = botCore.decodeAndVerify( event );
    if (decodedResponse.status !== 200) {
        decodedResponse.correlation_id = correlation_id;
        console.log('<--# GW-OUT-RESPONSE-OUT: Could not decode:' + JSON.stringify(decodedResponse, null, 2));

        return {
            statusCode: decodedResponse.status, correlation_id: correlation_id, body: JSON.stringify(decodedResponse)
        };
    }

    let configResponse = await botCore.getConfig(decodedResponse.data.address);
    if (configResponse.status !== 200) {
        configResponse.correlation_id = correlation_id;
        console.log('<--# GW-OUT-RESPONSE-OUT: Could not get the configuration:' + configResponse.status);

        return {
            statusCode: configResponse.status, error: 'Could not get the configuration:' + configResponse.status
        };
    }

    const request = decodedResponse.data.payload.request;

    console.log('-- GW-OUT-REQUEST-IN: ' + JSON.stringify(request, null, 2));

    const platformService = new PlatformService(new AWS.DynamoDB.DocumentClient(),  new AWS.SecretsManager({
        region: 'us-west-1'
    }));
    request.recipient.id_hash = platformService.botUserHash('email', request.recipient, configResponse.data.address);
    const isForced = typeof request.force !== 'undefined' ? request.force : false;
    const isOptedOut = await platformService.isBotUserOptedOut('email', request.recipient, configResponse.data.address);
    console.log('IsOptedOut:' + isOptedOut + ', isForced:' + isForced + ', IdHash:' + request.recipient.id_hash);
    if (!isForced && isOptedOut) {
        console.log('<--# GW-OUT-RESPONSE-OUT: The user is opted out');
        return {
            statusCode: 400, body: JSON.stringify( {error: 'The user of the bot has opted out from receiving messages.'})
        };
    }
    else {
        console.log('-- GW-OUT-RESPONSE-OPTED-OUT: ' + request.recipient.id_hash + ' is not opted out');
    }
    const emailResponder = new MailgunResponder(configResponse.data);
    await emailResponder.init();

    const response = await emailResponder.sendMessage(request);
    console.log('<--# GW-OUT-RESPONSE-OUT: ' + JSON.stringify(response, null, 2));
    return {
        statusCode: response.status, body: JSON.stringify(response)
    };
};

