'use strict';

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _FileUtil = require('./services/utils/FileUtil');

var _FileUtil2 = _interopRequireDefault(_FileUtil);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require("./Api"),
    Api = _require.Api;

var axios = require('axios');

var fileUtilService = new _FileUtil2.default();

var argv = _yargs2.default.usage('Usage: $0 <command> [options]').command('setup', 'Start the service').example('$0 setup  -k ../config.json -d ./data.txt', 'Make the call').alias('k', 'konfig').nargs('k', 1).describe('k', 'The configuration file').alias('d', 'data').nargs('d', 1).describe('d', 'The data file').demandOption(['k', 'd']).help('h').alias('h', 'help').epilog('copyright 2020').argv;
var configP = fileUtilService.parseFile(argv.konfig);
var configD = fileUtilService.parseFile(argv.data);

var endpoint = 'https://h4emb9easd.execute-api.us-west-1.amazonaws.com/dev/process/';

Promise.all([configP, configD]).then(async function (values) {
    console.log('Values:' + JSON.stringify(values, null, 2));
    var api = new Api();
    api.initializeAddress(values[0].seed);
    var signedTxn = api.sign(values[1]);

    var response = await axios.post(endpoint + values[0].botAddress, signedTxn, { headers: {
            "Authorization": values[0].apiToken
        } });

    console.log('txn:' + JSON.stringify(response.data, null, 2));
});