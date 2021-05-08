'use strict';
const {PlatformService} = require( "@payburner/sidewinder-service/PlatformService" );

const AWS = require('aws-sdk');
module.exports.process = async event => {
    console.log('Event:' + JSON.stringify(event, null, 2));
    const idHash = event.pathParameters.id_hash;

    const platformService = new PlatformService(new AWS.DynamoDB.DocumentClient(),  new AWS.SecretsManager({
        region: 'us-west-1'
    }));
    const optedOut = await platformService.optOutBotUser(idHash);
    console.log('-- OPT-OUT -- Hash:' + idHash + ', Response:' + optedOut);
    return {
        statusCode: 302,
        headers: {
            Location: 'https://payburnersocial.carrd.com',
        }
    };

};

