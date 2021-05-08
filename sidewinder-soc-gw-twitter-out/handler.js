'use strict';
const {BotCore} = require( "@payburner/sidewinder-service/BotCore" );
const {TwitterResponder} = require("./TwitterResponder");
const uuid4 = require('uuid4');
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

    const twitterResponder = new TwitterResponder(configResponse.data);
    await twitterResponder.init();

    const response = await twitterResponder.sendMessage(request);
    console.log('<--# GW-OUT-RESPONSE-OUT: ' + JSON.stringify(response, null, 2));
    return {
        statusCode: response.status, body: JSON.stringify(response)
    };
};

