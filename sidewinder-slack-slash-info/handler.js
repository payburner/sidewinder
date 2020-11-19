'use strict';
const {SlackService} = require( "./SlackService");
const AWS = require('aws-sdk');
const {SidewinderService} = require('@payburner/sidewinder-service');
const qs = require('querystring');

module.exports.process = async event => {
    console.log(JSON.stringify(event, null, 2));
    const data = qs.parse(event.body);

    let region = "us-west-1",
        secretName = "dev/sidewinder-slack-slash";
    let client = new AWS.SecretsManager({
        region: region
    });
    const result = await new Promise((resolve, reject) => {
        client.getSecretValue({SecretId: secretName}, function (err, data) {

            if (err) {
                console.log(err);
                reject()
            } else {
                resolve(JSON.parse(data.SecretString))
            }
        });
    });

    const docClient = new AWS.DynamoDB.DocumentClient();
    const sidewinderService = new SidewinderService(result.xrpAddressSecret, docClient , client);
    await sidewinderService.init();
    const slackService = new SlackService(result, sidewinderService);


    if (result.slackVerificationToken !== data.token){

        return {
            statusCode: 401,
            headers: {
                'Content-Type': 'application/json',
            },
            body: 'Unauthorized'
        };
    }

    if (typeof data.challenge !== 'undefined') {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: data.challenge
        };
    }


    console.log('Mention text:' + data.text);
    console.log('Mention user:' + data.user_id);
    console.log('Mention team:' + data.team_id);
    const response = await slackService.handleSlash(data.team_id, data.user_id, data.text);
    console.log('Handle Response:' + JSON.stringify(response, null, 2));


    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            response_type: 'ephemeral',
            text: response,
        }),
    };

};



