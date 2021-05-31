const uuid4 = require('uuid4');

function Level2Service( pConfig ) {
        this.pConfig = pConfig;

    this.getProcessDefinitionKeys = function() {
        return [ 'sweepout', 'sweepin' ];
    }

    this.getInputVariables = function( target_address, process_definition_key, body ) {
        if (process_definition_key === 'sweepout') {
            return {
                variables: {
                    target_address: {value: target_address, type: "string"},
                    source_currency: {value: body.source_currency, type: "string"},
                    target_currencies: {value: body.target_currencies, type: "string"},
                    exchange: {value: body.exchange, type: "string"},
                },
                businessKey: target_address + '-sweepout-' + body.exchange + '-' + uuid4()
            }
        }
        else if (process_definition_key === 'sweepin') {
            return {
                variables: {
                    target_address: {value: target_address, type: "string"},
                    source_currencies: {value: body.source_currencies, type: "string"},
                    target_currency: {value: body.target_currency, type: "string"},
                    exchange: {value: body.exchange, type: "string"},
                },
                businessKey: target_address + '-sweepin-' + body.exchange + '-' + uuid4()
            }
        }
        else {
            throw 'Unknown process process definition: ' + process_definition_key;
        }
    }

}

exports.Level2Service = Level2Service;
