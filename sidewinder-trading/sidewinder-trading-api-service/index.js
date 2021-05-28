const AWS = require('aws-sdk');
const { Client, logger, Variables, BasicAuthInterceptor } = require("camunda-external-task-client-js");

const {SidewinderOmsPersistenceService} = require("@payburner/sidewinder-trading-oms-p/src/SidewinderOmsPersistenceService");
const fs = require('fs');
const uuid4 = require('uuid4');
const express = require('express');
const http = require('http');
const axios = require('axios');
const app = express();

const pConfig = JSON.parse(fs.readFileSync(process.argv[2]).toString());

const basicAuthentication = new BasicAuthInterceptor({
    username: pConfig.CAMUNDA_USER,
    password: pConfig.CAMUNDA_PASSWORD
});


// configuration for the Client:
//  - 'baseUrl': url to the Process Engine
//  - 'logger': utility to automatically log important events
const config = { interceptors: basicAuthentication, baseUrl: "https://oms.payburner.com/engine-rest", use: logger };

// create a Client instance with custom configuration
const client = new Client(config);

AWS.config.update({
    accessKeyId: pConfig.AWS_ACCESS_ID,
    secretAccessKey: pConfig.AWS_ACCESS_KEY,
    region: pConfig.AWS_REGION
});

const docClient = new AWS.DynamoDB.DocumentClient();
const p = new SidewinderOmsPersistenceService( docClient );

app.get('/venues/:venueId/orders', function(req, res, next) {
    p.getOrdersAtExchange('rDDUyP2jvURCnc1PuqF4kvdYAWjzuAaDcH', req.params.venueId).then((response)=> {
        res.status(response.status).send(response);
    });
});

app.get('/venues/:venueId/gestures/sweepout', function(req, res, next) {
    const exchange = req.params.venueId;
    const source_currency = req.params.source_currency;
    const target_currencies = req.params.target_currencies;
    const target_address = 'rDDUyP2jvURCnc1PuqF4kvdYAWjzuAaDcH';
    //curl -H "Content-Type: application/json" -X POST -d '{"variables": { "target_address" : {"value":"rDDUyP2jvURCnc1PuqF4kvdYAWjzuAaDcH", "type" : "string"}, "exchange" : { "value" :"bitstamp","type":"string"}, "symbol" : {"value":"BTC/USD","type":"string"}, "side" : {"value":"sell","type":"string"}, "amount":{"value":0.0004, "type" : "double"} }, "businessKey" : "oms-marketorder-rDDUyP2jvURCnc1PuqF4kvdYAWjzuAaDcH-bitstamp-BTC/USD-1" }' https://admin:Y3ll0w41@oms.payburner.com/engine-rest/process-definition/key/marketorder/start

    const data = {
        variables : {
            target_address: {value: target_address, type : "string"},
            source_currency: {value: source_currency, type : "string"},
            target_currencies: {value: target_currencies, type : "string"},
        },
        businessKey : target_address + '-sweep-out-' + uuid4()
    }

    axios.post('https://oms.payburner.com/engine-rest/process-definition/key/sweepout/start',
        data, {
            // Axios looks for the `auth` option, and, if it is set, formats a
            // basic auth header for you automatically.
            auth: {
                username: pConfig.CAMUNDA_USER,
                password: pConfig.CAMUNDA_PASSWORD
            }
        })
        .then((response) => {
            const data = response.data;
            console.log('POST RESPONSE:' + JSON.stringify(data, null, 2));
            res.status(200).send( {status:200})
    }).catch((error) => {
        console.log('POST ERROR:' + JSON.stringify(error, null, 2));
        res.status(400).send({status:400,error:error});
    })

});

app.get('/venues/:venueId/balances', function(req, res, next) {
    p.getAccounts('rDDUyP2jvURCnc1PuqF4kvdYAWjzuAaDcH', req.params.venueId).then((response)=> {
        res.status(response.status).send(response);
    });
});

app.get('/venues/:venueId/symbols/:base/:counter/orders', function(req, res, next) {
    p.getOrdersForSymbol('rDDUyP2jvURCnc1PuqF4kvdYAWjzuAaDcH', req.params.venueId, req.params.base + '/' + req.params.counter).then((response)=> {
        res.status(response.status).send(response);
    });
});

app.use(express.static('public'));
app.use(function (req, res, next) {
    res.status(404).send({ status: 404, error: 'The path was not found.'})
})
http.createServer(app).listen(3553, function() {
    console.log('Server HTTP server listening on port ' + 3553);

});

