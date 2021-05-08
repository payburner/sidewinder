
const AWS = require('aws-sdk');
class SESResponder {

    constructor(config) {

        this.config = config;
        this.ses = null;
    }

    init() {

        this.ses = new AWS.SESV2({
            region: 'us-west-2', apiVersion: '2019-09-27'});
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
        const comp = this;

        const params = {
            Destination: {
                ToAddresses: [recipient.id] // Email address/addresses that you want to send your email
            },
            ConfigurationSetName: 'identity',
            Content: {
                Simple: {
                    Body: {
                        Text: {
                            Charset: "UTF-8",
                            Data: message
                        }
                    },
                    Subject: {
                        Charset: "UTF-8",
                        Data: "Payburner Social Response"
                    }
                }
            },
            FromEmailAddress:'social@id.payburner.com'
        };

        return new Promise((resolve, reject) => {
            const sendEmail = comp.ses.sendEmail(params).promise();
            return sendEmail.then((response) => {
                console.log("email submitted to SES", response);
                resolve({
                    status: 200, correlation_id: correlationId
                });
            })
        });
    }
}

module.exports.SESResponder = SESResponder;