const Twit = require('twit');

class TwitterResponder {

    constructor(config) {

        this.config = config;
        this.T = null;
    }

    init() {

        this.T = new Twit({
            consumer_key: this.config.apiKey,
            consumer_secret: this.config.apiSecretKey,
            access_token: this.config.accessToken,
            access_token_secret: this.config.accessTokenSecret,
            timeout_ms: 60 * 1000,  // optional HTTP request timeout to apply to all requests.
            strictSSL: true,     // optional - requires SSL certificates to be valid.
        });
    }

    status(status) {
        return new Promise((resolve) => {
            const callback = function (response) {
                console.log(
                    'Tweet sent response:' + JSON.stringify(response, null, 2));
                resolve({
                    status: 200, message: response
                });
            };
            this.T.post('statuses/update', {status: status}, callback);
        });
    }

    sendMessage(request) {
        const recipient = request.recipient;
        const message = request.message;
        const correlationId = request.correlation_id;
        const comp = this;
        return new Promise((resolve, reject) => {
            const sendMessage =
                {
                    "event": {
                        "type": "message_create",
                        "message_create": {
                            "target": {"recipient_id": recipient.id},
                            "message_data": {"text": message}
                        }
                    }
                };

            const callback = function (response) {
                if (typeof response !== 'undefined' && typeof response.message
                    !== 'undefined') {
                    resolve({status: 400, correlation_id: correlationId, error: response.message});
                    return;
                } else {
                    resolve({
                        status: 200, correlation_id: correlationId
                    });
                }
            };
            comp.T.post('direct_messages/events/new', sendMessage, callback);
        });
    }
}

module.exports.TwitterResponder = TwitterResponder;