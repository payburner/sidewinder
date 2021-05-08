class BotBusinessLogic {

    constructor(config, egress) {
        this.config = config;
        this.botName = config.botName;
        this.egress = egress;
    }

    handleDirectMessage(event) {
        const comp = this;
        return new Promise(async (resolve) => {

            if (event.payload.msg_text
                === '/help') {
                resolve('Hi, @' + event.users.originator.screen_name + '.  Welcome to @' + comp.botName
                    + '.  Commands include: /help, /ping, /pong');
            }
            else if (event.payload.msg_text
                === '/ping') {
                resolve( 'Hi there, ' +
                    '@' + event.users.originator.screen_name + ', pong back at you.');
            }
            else if (event.payload.msg_text
                === '/pong') {
                resolve(
                    'Hi there, ' +'@' + event.users.originator.screen_name + ', ping back at you.');
            }
            else {
                resolve('I beg your pardon, @' + event.users.originator.screen_name
                    + '. I did not understand that.  Commands include: /help, /ping, /pong');
            }
        });
    }

}

module.exports.BotBusinessLogic = BotBusinessLogic;