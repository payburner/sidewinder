import yargs from 'yargs';
import FileUtil from './services/utils/FileUtil';
const {Api} = require("./Api");
const axios = require('axios');


const fileUtilService = new FileUtil();

var argv = yargs
.usage('Usage: $0 <command> [options]')
.command('setup', 'Start the service')
.example(
    '$0 setup  -k ../config.json -d ./data.txt',
    'Make the call')
.alias('k', 'konfig')
.nargs('k', 1)
.describe('k', 'The configuration file')

.alias('d', 'data')
.nargs('d', 1)
.describe('d', 'The data file')
.demandOption([ 'k', 'd'])
.help('h')
.alias('h', 'help')
.epilog('copyright 2020')
    .argv;
const configP = fileUtilService.parseFile(argv.konfig);
const configD = fileUtilService.parseFile(argv.data);

const endpoint = 'https://h4emb9easd.execute-api.us-west-1.amazonaws.com/dev/process/';

Promise.all([configP, configD]).then( async function (values) {
    console.log('Values:' + JSON.stringify(values, null, 2))
    const api = new Api();
    api.initializeAddress(values[0].seed);
    const signedTxn = api.sign(values[1]);

    const response = await axios.post(endpoint + values[0].botAddress, signedTxn , {headers: {
            "Authorization":values[0].apiToken
        }});


    console.log('txn:' + JSON.stringify(response.data, null, 2));

});