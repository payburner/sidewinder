
class BotUserEventsService {

    constructor( config, docClient ) {
        this.config = config;
        this.docClient = docClient;
    }

    hasFollowEvent( platform, user ) {
        let id = user.id;
        const self = this;
        if (typeof id === "number") {
            id = id.toFixed(0);
        }
        return new Promise(async (resolve, reject) => {

            const eventId = 'user-follow-bot/' + self.config.botName + '/' + platform + '/' + id;

            const params = {
                TableName: "sidewinder_service_user_events",
                KeyConditionExpression: "event_id = :event_id",
                ExpressionAttributeValues: {
                    ":event_id": eventId
                }
            };

            self.docClient.query(params, function (err, data) {
                if (err) {
                    resolve(false);
                } else {

                    if (data.Items.length > 0) {
                        resolve(true);
                    }
                    else {
                        resolve(false);
                    }
                }
            });
        });
    }

    addFollowEvent( platform, user ) {

        let id = user.id;
        const self = this;
        if (typeof id === "number") {
            id = id.toFixed(0);
        }
        return new Promise(async (resolve, reject) => {
            const dataBody = {
                bot_name: self.config.botName,
                event_id: 'user-follow-bot/' + self.config.botName + '/' + platform + '/' + id,
                bot_user_key: self.config.botName + '/' + platform + '/' + id,
                event_type: 'user-follow-bot',
                description: 'You followed the bot.',
                sort_key: Number.MAX_SAFE_INTEGER - new Date().getTime(),
                bot_platform: platform,
                user_id: id,
                user_screen_name: user.screen_name,
                timestamp: new Date().toISOString()
            };
            const update = {
                Put: {
                    TableName: 'sidewinder_service_user_events',
                    Item: dataBody,
                    ConditionExpression: "attribute_not_exists(event_id)"
                }
            }

            resolve(await self.transactionalWrite(update));
        });

    }

    addLikeEvent( platform, user, post_id, post_text ) {

        let id = user.id;
        const self = this;
        if (typeof id === "number") {
            id = id.toFixed(0);
        }
        return new Promise(async (resolve, reject) => {
            const dataBody = {
                bot_name: self.config.botName,
                event_id: 'user-like-micro-blog/' + self.config.botName + '/' + platform + '/' + id + '/' + post_id,
                bot_user_key: self.config.botName + '/' + platform + '/' + id,
                event_type: 'user-like-micro-blog',
                description: 'You liked a tweet by the bot: ' + post_text,
                sort_key: Number.MAX_SAFE_INTEGER - new Date().getTime(),
                bot_platform: platform,
                user_id: id,
                user_screen_name: user.screen_name,
                timestamp: new Date().toISOString()
            };
            const update = {
                Put: {
                    TableName: 'sidewinder_service_user_events',
                    Item: dataBody,
                    ConditionExpression: "attribute_not_exists(event_id)"
                }
            }

            resolve(await self.transactionalWrite(update));
        });
    }

    addMentionEvent( platform, user, post_id, post_text ) {

        let id = user.id;
        const self = this;
        if (typeof id === "number") {
            id = id.toFixed(0);
        }
        return new Promise(async (resolve, reject) => {
            const dataBody = {
                bot_name: self.config.botName,
                event_id: 'user-micro-blog-mention/' + self.config.botName + '/' + platform + '/' + id + '/' + post_id,
                bot_user_key: self.config.botName + '/' + platform + '/' + id,
                event_type: 'user-micro-blog-mention',
                description: 'You mentioned the bot in a post: ' + post_text,
                sort_key: Number.MAX_SAFE_INTEGER - new Date().getTime(),
                bot_platform: platform,
                user_id: id,
                user_screen_name: user.screen_name,
                timestamp: new Date().toISOString()
            };
            const update = {
                Put: {
                    TableName: 'sidewinder_service_user_events',
                    Item: dataBody,
                    ConditionExpression: "attribute_not_exists(event_id)"
                }
            }

            resolve(await self.transactionalWrite(update));
        });
    }

    addTypingEvent( platform, user, event_timestamp ) {

        let id = user.id;
        const self = this;
        if (typeof id === "number") {
            id = id.toFixed(0);
        }
        return new Promise(async (resolve, reject) => {
            const dataBody = {
                bot_name: self.config.botName,
                event_id: 'user-typing/' + self.config.botName + '/' + platform + '/' + id + '/' + event_timestamp,
                bot_user_key: self.config.botName + '/' + platform + '/' + id,
                event_type: 'user-typing',
                description: 'You typed a bit ' ,
                sort_key: Number.MAX_SAFE_INTEGER - new Date().getTime(),
                bot_platform: platform,
                user_id: id,
                user_screen_name: user.screen_name,
                timestamp: new Date().toISOString()
            };
            const update = {
                Put: {
                    TableName: 'sidewinder_service_user_events',
                    Item: dataBody,
                    ConditionExpression: "attribute_not_exists(event_id)"
                }
            }

            resolve(await self.transactionalWrite(update));
        });
    }

    transactionalWrite( update ) {
        const self = this;
        return new Promise( async (resolve, reject) => {

            console.log('Items:' + JSON.stringify([update], null, 2));

            console.log('Sending Write Request to DB');
            self.docClient.transactWrite({ TransactItems: [update] }, function (err, data) {
                if (err) {
                    console.log('AWS Transactional Write Error:' + err);
                    console.log('AWS Transactional Write Error:' + JSON.stringify(err, null, 2));
                    resolve(false)
                } else {
                    resolve(true);
                }
            });
        });
    }
}

module.exports.BotUserEventsService = BotUserEventsService;