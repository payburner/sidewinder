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
    const config = await new Promise((resolve, reject) => {
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
    const sidewinderService = new SidewinderService(config.xrpAddressSecret, docClient , client, config);
    await sidewinderService.init();
    const slackService = new SlackService(config, sidewinderService);

    if (config.slackVerificationToken !== data.token){

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

    const response = await slackService.handleSlash(data.team_id, data.user_id, data.text);

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



