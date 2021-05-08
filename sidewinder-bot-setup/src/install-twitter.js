import yargs from 'yargs';
import FileUtil from './services/utils/FileUtil';
import {Autohook} from "twitter-autohook";

const fileUtilService = new FileUtil();

var argv = yargs
.usage('Usage: $0 <command> [options]')
.command('setup', 'Start the service')
.example(
    '$0 setup  -k ../config.json',
    'Setup the webhook')
.alias('k', 'konfig')
.nargs('k', 1)
.describe('k', 'The configuration file')
.demandOption([ 'k'])
.help('h')
.alias('h', 'help')
.epilog('copyright 2020')
    .argv;
const configP = fileUtilService.parseFile(argv.konfig);


Promise.all([configP]).then(function (values) {

    const config = values[0];

    const hookConfig = {
        token: config.twitter_accessToken,
        token_secret: config.twitter_accessTokenSecret,
        consumer_key: config.twitter_apiKey,
        consumer_secret: config.twitter_apiSecretKey,
        env: config.twitter_env
    };
    const webhook = new Autohook(hookConfig);
    console.log('WebHook Env:' + webhook.twitter_env);
    webhook.removeWebhooks().then(function (done) {
        webhook.start(
           'https://7lshtmjl4e.execute-api.us-west-1.amazonaws.com/dev/process/' +config.sidewinder_address ).then(
            function (hook) {
                webhook.subscribe({
                    oauth_token: hookConfig.token,
                    oauth_token_secret: hookConfig.token_secret,
                }).then(function (subscribed) {
                    console.log('subscribed:' + subscribed);
                });
            });
    });

});