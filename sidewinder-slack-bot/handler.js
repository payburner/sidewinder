'use strict';
const {SlackService} = require("./SlackService");
const AWS = require('aws-sdk');
const {SidewinderService} = require('@payburner/sidewinder-service');
const qs = require('qs');
const axios = require('axios');

const ensureIdempotency = function (docClient, id) {
    return new Promise((resolve) => {
        const dynamodbParams = {
            TableName: 'sidewinder_message_idempotency',
            Item: {
                id: id
            },
            ConditionExpression: 'attribute_not_exists(id)'
        };
        docClient.put(dynamodbParams, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                resolve(false);
            } else {
                console.log(data);
                resolve(true);
            }
        });
    })
}

module.exports.process = async event => {
    console.log(JSON.stringify(event, null, 2));
    const data = JSON.parse(event.body);

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
    const sidewinderService = new SidewinderService(config.xrpAddressSecret,
        docClient, client, config);
    await sidewinderService.init();
    const slackService = new SlackService(config, sidewinderService);

    if (config.slackVerificationToken !== data.token) {

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

    if (typeof data.event !== 'undefined' && typeof data.event.type
        !== 'undefined' && data.event.type == 'app_mention') {
        const ensured = await ensureIdempotency(docClient,
            data.event.client_msg_id);
        if (ensured) {
            const response = await slackService.handleMention(data.event.team,
                data.event.user, data.event.text);
            console.log('Handle Response:' + JSON.stringify(response, null, 2));
        }
    } else if (typeof data.event !== 'undefined' && typeof data.event.type
        !== 'undefined' && data.event.type == 'app_home_opened') {
        const ensured = await ensureIdempotency(docClient, data.event_id);
        if (ensured) {
            const response = await slackService.handleVisitHome(data.team_id,
                data.event.user, data.event.tab);
            const args = {
                token: config.oauthToken,
                user_id: data.event.user,
                view: JSON.stringify(response)
            };

            await axios.post(
                'https://slack.com/api/views.publish', qs.stringify(args));
        }
    }

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            response_type: 'ephemeral',
            text: data.text,
        }),
    };
};



