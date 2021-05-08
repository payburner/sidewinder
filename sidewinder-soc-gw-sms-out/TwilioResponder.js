const twilio = require('twilio');
const AWS = require('aws-sdk');

class TwilioResponder {

    constructor(config) {

        this.config = config;

    }

    init() {

    }

    status(status) {
        return new Promise((resolve) => {

                console.log(
                    'SMS sent response: no sms status');
                resolve({
                    status: 200, message: 'No SMS status'
                });
        });
    }

    sendMessage(request) {
        const recipient = request.recipient;
        const message = request.message;
        const correlationId = request.correlation_id;
        const self = this;

        return new Promise((resolve, reject) => {

            const accountSid = self.config.twilio_account_sid;
            const authToken = self.config.twilio_auth_token;
            const client = twilio(accountSid, authToken);

            client.messages
            .create({body: message + ' -- Payburner Social: https://bit.ly/2LLc0r7', from: self.config.twilio_phone_number, to: recipient.id })
            .then(message => {
                console.log(message.sid);
                resolve({
                    status: 200, correlation_id: correlationId, messageId: message.sid
                });
            });

        });
    }
}

module.exports.TwilioResponder = TwilioResponder;