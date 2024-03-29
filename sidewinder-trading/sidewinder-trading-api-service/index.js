const AWS = require('aws-sdk');
const { Client, logger, Variables, BasicAuthInterceptor } = require("camunda-external-task-client-js");

const {SidewinderOmsPersistenceService} = require("@payburner/sidewinder-trading-oms-p/src/SidewinderOmsPersistenceService");
const fs = require('fs');
const uuid4 = require('uuid4');
const express = require('express');
const http = require('http');
const axios = require('axios');
const {Level2Service} = require('./services/Level2Service');
const app = express();
const bodyParser = require('body-parser');
const pConfig = JSON.parse(fs.readFileSync(process.argv[2]).toString());
const level2Service = new Level2Service(pConfig);
const basicAuthentication = new BasicAuthInterceptor({
    username: pConfig.CAMUNDA_USER,
    password: pConfig.CAMUNDA_PASSWORD
});

const jsonParser = bodyParser.json({limit: '20mb'});
app.use(jsonParser);

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

app.get('/venues/:venueId/level2/:processDefinitionKey/instance', function(req, res, next) {

    axios.get('https://oms.payburner.com/engine-rest/process-instance?processDefinitionKey='
        + req.params.processDefinitionKey + '&active=true',
         {
            // Axios looks for the `auth` option, and, if it is set, formats a
            // basic auth header for you automatically.
            auth: {
                username: pConfig.CAMUNDA_USER,
                password: pConfig.CAMUNDA_PASSWORD
            }
        })
        .then((response) => {
            const data = response.data;
            console.log('GET RESPONSE:' + JSON.stringify(data, null, 2));
            res.status(200).send( {status:200, data: data})
        }).catch((error) => {
        console.log('POST ERROR:' + JSON.stringify(error, null, 2));
        res.status(400).send({status:400,error:error});
    })

});

app.get('/venues/:venueId/level2/instance', function(req, res, next) {

    const level2Keys = level2Service.getProcessDefinitionKeys();
    const promises = level2Keys.map((k) => {
        return axios.get('https://oms.payburner.com/engine-rest/process-instance?processDefinitionKey='
            + k + '&active=true',
            {
                // Axios looks for the `auth` option, and, if it is set, formats a
                // basic auth header for you automatically.
                auth: {
                    username: pConfig.CAMUNDA_USER,
                    password: pConfig.CAMUNDA_PASSWORD
                }
            });
    });

    Promise.all(promises).then((values) => {
        const all = [];
        console.log('Values:' + values.length);
        values.map((response) => response.data ).forEach((data) => {
            console.log('DATA:' + JSON.stringify(data, null, 2));
            data.forEach((v)=>all.push(v));
        });
        console.log('ALL:' + JSON.stringify(all, null, 2));
        res.status(200).send( {status:200, data: all})
    })

});

app.post('/venues/:venueId/level2/:processDefinitionKey', function(req, res, next) {

    const target_address = 'rDDUyP2jvURCnc1PuqF4kvdYAWjzuAaDcH';

    const data = level2Service.getInputVariables(target_address, req.params.processDefinitionKey, req.body );

    axios.post('https://oms.payburner.com/engine-rest/process-definition/key/' + req.params.processDefinitionKey + '/start',
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
            res.status(200).send( {status:200, data: {
                    process_instance_id: data.id
                }})
        }).catch((error) => {
        console.log('POST ERROR:' + JSON.stringify(error, null, 2));
        res.status(400).send({status:400,error:error});
    })

});

app.post('/venues/:venueId/orders/marketorder', function(req, res, next) {
    const body = req.body;
    const target_address = 'rDDUyP2jvURCnc1PuqF4kvdYAWjzuAaDcH';

    const data = {
        variables : {
            target_address: {value: target_address, type : "string"},
            symbol: {value: req.body.symbol, type : "string"},
            side: {value: req.body.side, type : "string"},
            amount: {value: req.body.amount, type : "double"},
            exchange: {value: req.body.exchange, type : "string"},
        },
        businessKey : target_address + '-marketorder-' + req.body.exchange + '-' + req.body.symbol + '-' + uuid4()
    }

    axios.post('https://oms.payburner.com/engine-rest/process-definition/key/marketorder/start',
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
            res.status(200).send( {status:200, data: {
                    process_instance_id: data.id
                }})
        }).catch((error) => {
        console.log('POST ERROR:' + JSON.stringify(error, null, 2));
        res.status(400).send({status:400,error:error});
    })

});

app.post('/venues/:venueId/orders/instantorder', function(req, res, next) {
    const body = req.body;
    const target_address = 'rDDUyP2jvURCnc1PuqF4kvdYAWjzuAaDcH';

    const data = {
        variables : {
            target_address: {value: target_address, type : "string"},
            symbol: {value: req.body.symbol, type : "string"},
            side: {value: req.body.side, type : "string"},
            amount: {value: req.body.amount, type : "double"},
            exchange: {value: req.body.exchange, type : "string"},
        },
        businessKey : target_address + '-instantorder-' + req.body.exchange + '-' + req.body.symbol + '-' + uuid4()
    }

    axios.post('https://oms.payburner.com/engine-rest/process-definition/key/instantorder/start',
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
            res.status(200).send( {status:200, data: {
                    process_instance_id: data.id
                }})
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
express.json();
app.use(express.static('public'));
app.use(function (req, res, next) {
    res.status(404).send({ status: 404, error: 'The path was not found.'})
})
http.createServer(app).listen(3553, function() {
    console.log('Server HTTP server listening on port ' + 3553);

});

