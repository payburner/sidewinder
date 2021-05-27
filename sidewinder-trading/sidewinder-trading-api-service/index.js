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

app.get('/venues/:venueId/symbol/:symbol/orders', function(req, res, next) {
    p.getOrdersForSymbol('rDDUyP2jvURCnc1PuqF4kvdYAWjzuAaDcH', req.params.venueId, req.params.symbol).then((response)=> {
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

