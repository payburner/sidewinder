const uuid4 = require('uuid4');

class TwitterHandler {

    constructor(config) {
        this.config = config;
        this.botName = config.botName;
    }

    init() {
    }

    getUser(payload, userId) {
        if (typeof payload.users !== 'undefined') {
            if (typeof payload.users[userId] !== null && payload.users[userId]
                !== null) {
                return payload.users[userId];
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    handleMessage(payload, messageEvent) {
        const comp = this;

        if (messageEvent.type === 'message_create') {

            const senderId = messageEvent.message_create.sender_id;
            const senderUser = comp.getUser(payload, senderId);

            if (senderUser !== null) {

                const senderScreenName = senderUser.screen_name;

                // -- let us test to see if the source name is the name of the bot
                if (senderScreenName === comp.botName) {
                    console.log('Ignoring dm by the bot');
                    return null;
                } else {

                    const event = {
                        event_type: 'direct-message',
                        action: 'create',
                        event_id: messageEvent.id,
                        platform: 'twitter',
                        timestamp: new Date().getTime(),
                        bot_name: this.botName,
                        bot_address: this.config.address,
                        users: {
                            originator: {
                                id: senderId,
                                screen_name: senderScreenName,
                                is_bot: false
                            },
                            target: {
                                id: messageEvent.message_create.target.recipient_id,
                                screen_name: comp.botName,
                                is_bot: true,
                            }
                        },
                        payload: {
                            msg_text: messageEvent.message_create.message_data.text
                        }
                    }
                    return event;
                }
            }

        }
        return null;

    }

    handleFavoriteEvent(favoriteEvent) {

        const likerScreenName = favoriteEvent.user.screen_name;
        if (likerScreenName !== this.botName) {
            const event = {
                event_type: 'like-post',
                platform: 'twitter',
                event_id: favoriteEvent.id,
                timestamp: new Date().getTime(),
                bot_name: this.botName,
                bot_address: this.config.address,
                users: {
                    originator: {
                        id: favoriteEvent.user.id_str,
                        screen_name: likerScreenName,
                        is_bot: false
                    },
                    target: {
                        id: favoriteEvent.favorited_status.user.id_str,
                        screen_name: favoriteEvent.favorited_status.user.screen_name,
                        is_bot: true
                    }
                },
                payload: {
                    post_id: favoriteEvent.favorited_status.id_str,
                    post_text: favoriteEvent.favorited_status.text
                }
            }
            return event;
        }
        return null;

    }

    handleFollowEvent(followEvent) {

        if (followEvent.type === 'follow'
            && followEvent.target.screen_name
            === this.botName) {
            const sourceScreenName = followEvent.source.screen_name;
            const event = {
                event_type: 'follow',
                platform: 'twitter',
                event_id: uuid4(),
                timestamp: new Date().getTime(),
                bot_name: this.botName,
                bot_address: this.config.address,
                users: {
                    originator: {
                        id: followEvent.source.id,
                        screen_name: sourceScreenName,
                        is_bot: false
                    },
                    target: {
                        id: followEvent.target.id,
                        screen_name: followEvent.target.screen_name,
                        is_bot: true
                    }
                },
                payload: {}
            }
            return event;

        }
        return null;

    }

    handleTweetEvent(tweetCreateEvent) {
        const comp = this;

        if (typeof tweetCreateEvent.in_reply_to_screen_name
            !== 'undefined') {

            const sourceScreenName = tweetCreateEvent.user.screen_name;

            if (sourceScreenName === comp.botName) {
                return null;
            }

            const text = tweetCreateEvent.text; // @toocool2betrue @PayburnerBot +1
            if (typeof text !== 'undefined' && text !== null) {
                const event = {
                    event_type: 'micro-blog',
                    action: 'reply',
                    event_id: tweetCreateEvent.id_str,
                    platform: 'twitter',
                    timestamp: new Date().getTime(),
                    bot_name: this.botName,
                    bot_address: this.config.address,
                    users: {
                        originator: {
                            id: tweetCreateEvent.user.id_str,
                            screen_name: sourceScreenName,
                            is_bot: false
                        },
                        target: {
                            id: tweetCreateEvent.in_reply_to_user_id_str,
                            screen_name: tweetCreateEvent.in_reply_to_screen_name,
                            is_bot: tweetCreateEvent.in_reply_to_screen_name
                            === comp.botName ? true : false
                        }
                    },
                    payload: {
                        micro_blog_text: text
                    }
                }
                return event;
            }
        }
        return null;
    }

    handleIndicateTyping(users, indicate_typing_event) {
        const comp = this;

        const sourceScreenName = indicate_typing_event.sender_id;

        if (sourceScreenName === comp.config.twitterId) {
            return null;
        }

        const event = {
            event_type: 'typing',
            action: 'not_applicable',
            event_id: indicate_typing_event.created_timestamp,
            platform: 'twitter',
            timestamp: new Date().getTime(),
            bot_name: this.botName,
            bot_address: this.config.address,
            users: {
                originator: {
                    id: indicate_typing_event.sender_id,
                    screen_name: users[indicate_typing_event.sender_id].screen_name,
                    is_bot: false
                },
                target: {
                    id: indicate_typing_event.target.recipient_id,
                    screen_name: users[indicate_typing_event.target.recipient_id].screen_name,
                    is_bot: users[indicate_typing_event.target.recipient_id].screen_name
                    === comp.botName ? true : false
                }
            },
            payload: {
            }
        }
        return event;

        return null;
    }

    onAccountApiPayload(body) {

        const comp = this;
        const payload = body;
        const events = [];
        console.log(JSON.stringify(body, null, 2));

        if (typeof payload.for_user_id === 'string') {

            if (typeof payload.direct_message_events !== 'undefined') {
                payload.direct_message_events.forEach(
                    (messageEvent) => {
                        const event = comp.handleMessage(payload, messageEvent);
                        if (event !== null) {
                            events.push(event);
                        }
                    });
            }
            if (typeof payload.follow_events !== 'undefined') {
                payload.follow_events.forEach((followEvent) => {
                    const event = comp.handleFollowEvent(followEvent);
                    if (event !== null) {
                        events.push(event);
                    }
                });
            }
            if (typeof payload.favorite_events !== 'undefined') {
                payload.favorite_events.forEach(
                    (favorite_event) => {
                        const event = comp.handleFavoriteEvent(favorite_event);
                        if (event !== null) {
                            events.push(event);
                        }
                    });
            }
            if (typeof payload.tweet_create_events !== 'undefined') {
                payload.tweet_create_events.map(
                    async (tweetCreateEvent) => {
                        const event = comp.handleTweetEvent(tweetCreateEvent);
                        if (event !== null) {
                            events.push(event);
                        }
                    });

            }

            if (typeof payload.direct_message_indicate_typing_events
                !== 'undefined') {
                payload.direct_message_indicate_typing_events.map(
                    async (direct_message_indicate_typing_event) => {
                        const event = comp.handleIndicateTyping(payload.users,
                            direct_message_indicate_typing_event);
                        if (event !== null) {
                            events.push(event);
                        }
                    });

            }

        }
        return events;

    }

}

module.exports.TwitterHandler = TwitterHandler;