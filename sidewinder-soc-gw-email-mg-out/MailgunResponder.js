var Mailgun = require('mailgun-js');
const AWS = require('aws-sdk');
class MailgunResponder {

    constructor(config) {

        this.config = config;
        this.mailgun = null;
    }

    init() {

       this.mailgun = new Mailgun({apiKey: this.config.mailgun_api_key, domain: this.config.mailgun_domain });
    }

    status(status) {
        return new Promise((resolve) => {

                console.log(
                    'Email sent response: no e-mail status');
                resolve({
                    status: 200, message: 'No Email status'
                });
        });
    }

    sendMessage(request) {
        const recipient = request.recipient;
        const message = request.message;
        const correlationId = request.correlation_id;
        const self = this;


        return new Promise((resolve, reject) => {

            const data = {
                //Specify email data
                from: self.config.mailgun_email_address,
                //The email to contact
                to: recipient.id,
                //Subject and text data
                subject: 'Message from ' + self.config.mailgun_email_address,
                template: "msg-template",
                'h:X-Mailgun-Variables': JSON.stringify({
                    "msg": message.replace(/\n/g, "<br />"),
                    "unsubscribe_bot_link":
                        "https://i4rdc35d35.execute-api.us-west-1.amazonaws.com/dev/optout/" + recipient.id_hash,
                    "twitter_bot_link": "https://www.twitter.com/" + self.config.botName,
                    "bot_twitter_screen_name": self.config.botName,
                    "bot_help_url" : self.config.bot_help_url,
                    "bot_about" : self.config.bot_about
                })
            };
            console.log('Data:' + JSON.stringify(data, null, 2));
            //Invokes the method to send emails given the above data with the helper library
            self.mailgun.messages().send(data, function (err, body) {
                //If there is an error, render the error page
                if (err) {
                    resolve({
                        status: 400, correlation_id: correlationId, error: err
                    });
                }
                //Else we can greet    and leave
                else {
                    resolve({
                        status: 200, correlation_id: correlationId
                    });
                }
            });
        });
    }
}

module.exports.MailgunResponder = MailgunResponder;