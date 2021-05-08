const {BotUserEventsService} = require("./BotUserEventsService");

class BotEventsDriver {

    constructor( config, docClient ) {
        this.userEventsService = new BotUserEventsService(config, docClient);
    }

    async doProcess( events, botBusinessLogic ) {
        const comp = this;
        // -- now in the normalized events, let us discover if there is 1 and only 1 slash request...
        const slashRequest = events.filter((event)=>{
            return event.event_type === 'direct-message' && !event.payload.msg_text.startsWith('I beg your pardon,');
        });

        if (slashRequest.length === 1) {
            console.log('BotEventsDriver :: handle direct message: ' + JSON.stringify( slashRequest[0], null, 2));

            const response = await botBusinessLogic.handleDirectMessage( slashRequest[0] );
            if (response !== null) {
                return {
                    statusCode: 200, body: JSON.stringify({
                        status: 200, data: {
                            slash_response: response,
                            slash_respond_to: slashRequest[0].users.originator,
                            slash_response_status: true
                        }
                    })
                };
            }
            const notSlashEvents = events.filter((event)=>{
                return event.event_type !== 'direct-message'
            });
            if (notSlashEvents.length > 0) {
                await comp.handleEvents(notSlashEvents, botBusinessLogic);
            }
        }
        else {
            if (events.length > 0) {
                await comp.handleEvents(events, botBusinessLogic);
            }
        }

        return {
            statusCode: 200, body: JSON.stringify({
                status: 200, data: {
                    slash_response_status: false
                }
            })
        };
    }

    async handleEvents(events, botBusinessLogic) {
        for (let idx = 0; idx < events.length; idx++) {

            const event = events[idx];
            console.log('BotEventsDriver :: processing event: ' + JSON.stringify(event, null, 2));
            if (!event.users.originator.is_bot && event.users.originator.is_new_bot_user) {
                if (typeof botBusinessLogic['onNewUser']) {
                    try {
                        await botBusinessLogic.onNewUser(event,
                            event.users.originator);
                        console.log('BotEventsDriver :: New bot user notified:' + JSON.stringify(event.users.originator));
                    }
                    catch(error) {
                        console.log('BotEventsDriver :: New bot user error:' + JSON.stringify(error));
                        console.log('BotEventsDriver :: New bot user error:' + error);
                    }
                }
                else {
                    console.log('BotEventsDriver :: BotEventsDriver :: onNewUser not implemented: ' + JSON.stringify(event.users.originator, null, 2));
                }
            }
            if (!event.users.target.is_bot && event.users.target.is_new_bot_user) {
                if (typeof botBusinessLogic['onNewUser']) {
                    try {
                        await botBusinessLogic.onNewUser(event,
                            event.users.target);
                        console.log('BotEventsDriver :: New bot user notified:' + JSON.stringify(event.users.target));
                    }
                    catch(error) {
                        console.log('BotEventsDriver :: New bot user error:' + JSON.stringify(error));
                        console.log('BotEventsDriver :: New bot user error:' + error);
                    }
                }
                else {
                    console.log('BotEventsDriver :: onNewUser not implemented: ' + JSON.stringify(event.users.target, null, 2));
                }
            }

            if (event.event_type === 'follow') {
                const isNewEvent = await this.userEventsService.addFollowEvent(event.platform, event.users.originator);
                if (isNewEvent && typeof botBusinessLogic['handleFollowEvent'] !== 'undefined') {
                    event.users.originator.is_following = true;
                    await botBusinessLogic.handleFollowEvent(event);
                }
                else if (isNewEvent && typeof botBusinessLogic['handleFollowEvent'] === 'undefined') {
                    console.log('BotEventsDriver :: not implemented: ' + JSON.stringify(event, null, 2));
                }
                else {
                    console.log('BotEventsDriver :: ignoring already following:' + JSON.stringify(event, null, 2));
                }
            } else if (event.event_type === 'like-post') {
                const isNewEvent = await this.userEventsService.addLikeEvent(event.platform, event.users.originator, event.payload.post_id, event.payload.post_text);
                if (isNewEvent && typeof botBusinessLogic['handleFavoriteEvent'] !== 'undefined') {
                    const isFollowing = await this.userEventsService.hasFollowEvent(event.platform, event.users.originator);
                    event.users.originator.is_following = isFollowing;
                    await botBusinessLogic.handleFavoriteEvent(event);
                }
                else if (isNewEvent && typeof botBusinessLogic['handleFavoriteEvent'] === 'undefined') {
                    console.log('BotEventsDriver :: not implemented: ' + JSON.stringify(event, null, 2));
                }
                else {
                    console.log('BotEventsDriver :: ignoring already liked:' + JSON.stringify(event, null, 2));
                }
            } else if (event.event_type === 'micro-blog') {
                const isNewEvent = await this.userEventsService.addMentionEvent(event.platform, event.users.originator, event.event_id, event.payload.micro_blog_text);
                if (isNewEvent && typeof botBusinessLogic['handleMicroBlogEvent'] !== 'undefined') {
                    const isFollowing = await this.userEventsService.hasFollowEvent(event.platform, event.users.originator);
                    event.users.originator.is_following = isFollowing;
                    await botBusinessLogic.handleMicroBlogEvent(event);
                }
                else if (isNewEvent && typeof botBusinessLogic['handleMicroBlogEvent'] === 'undefined') {
                    console.log('BotEventsDriver :: not implemented handleMicroBlogEvent : ' + JSON.stringify(event, null, 2));
                }
                else {
                    console.log('BotEventsDriver :: ignoring already handled:' + JSON.stringify(event, null, 2));
                }

            }
            else if (event.event_type === 'typing') {
                const isNewEvent = await this.userEventsService.addTypingEvent(event.platform, event.users.originator, event.event_id);
                if (isNewEvent && typeof botBusinessLogic['handleTypingEvent'] !== 'undefined') {
                    const isFollowing = await this.userEventsService.hasFollowEvent(event.platform, event.users.originator);
                    event.users.originator.is_following = isFollowing;
                    await botBusinessLogic.handleTypingEvent(event);
                }
                else if (isNewEvent && typeof botBusinessLogic['handleTypingEvent'] === 'undefined') {
                    console.log('BotEventsDriver :: not implemented handleTypingEvent : ' + JSON.stringify(event, null, 2));
                }
                else {
                    console.log('BotEventsDriver :: ignoring already handled:' + JSON.stringify(event, null, 2));
                }

            }

            else {
                console.log('Alert -- unhandled event:' + JSON.stringify(event, null, 2));
            }
        }
    }
}

module.exports.BotEventsDriver = BotEventsDriver;