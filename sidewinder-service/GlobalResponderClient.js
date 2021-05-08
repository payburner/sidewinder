const {TwitterResponderClient} = require('./TwitterResponderClient');
const {MailgunResponderClient} = require('./MailgunResponderClient');
const {TwilioResponderClient} = require('./TwilioResponderClient');
const AWS = require('aws-sdk');
const {PlatformService} = require('./PlatformService');
class GlobalResponderClient {

    constructor(config) {
        this.config = config;
        this.secretClient = new AWS.SecretsManager({
            region: 'us-west-1'
        });
        this.docClient = new AWS.DynamoDB.DocumentClient();
        this.platformService = new PlatformService(
            this.docClient, this.secretClient);
        this.twitter = new TwitterResponderClient(config, this.platformService);
        this.email = new MailgunResponderClient(config, this.platformService);
        this.twilio = new TwilioResponderClient(config, this.platformService);
    }

    getBotIdField(platform) {
        if (typeof platform === 'undefined') {
            return {status:400,error:'no platform'};

        }
        else if ( platform === 'twitter') {
            return {status: 200, data: 'twitterId'}

        }
        else if ( platform === 'email') {

            return {status:200, data:'mailgun_email_address'};

        }
        else if ( platform === 'phone') {
            return {status:200, data:'twilio_phone_number'};
        }
        else {
            return {status:400,error:'unknown platform:' + platform };
        }
    }

    async formatId(platform, country, id) {
        if (typeof platform === 'undefined') {

               return {status:400,error:'no platform'};

        }
        else if ( platform === 'twitter') {
            //@TODO -- validate twitter
            return this.twitter.formatId(country, id);

        }
        else if ( platform === 'email') {
            //@TODO -- validate e-mail
            return {status:200, data:id};

        }
        else if ( platform === 'phone') {
            return this.twilio.formatId(country, id);
        }
        else {
            return {status:400,error:'unknown platform:' + platform };
        }
    }

    sendMessage(request) {
        if (typeof request.platform === 'undefined') {
            return new Promise((resolve) => {
                resolve({status:400,error:'no platform'})
            })
        }
        else if (request.platform === 'twitter') {
            return this.twitter.sendMessage(request);
        }
        else if (request.platform === 'email') {
            return this.email.sendMessage(request);
        }
        else if (request.platform === 'phone') {
            return this.twilio.sendMessage(request);
        }
        else {
            return new Promise((resolve) => {
                resolve({status:400,error:'unknown platform:' + request.platform })
            })
        }
    }

}

module.exports.GlobalResponderClient = GlobalResponderClient;