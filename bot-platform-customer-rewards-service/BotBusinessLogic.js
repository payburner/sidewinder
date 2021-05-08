
const {RewardsService} = require( "@payburner/sidewinder-service/RewardsService");

class BotBusinessLogic {

    constructor(config, egress) {
        this.config = config;
        this.botName = config.botName;
        this.egress = egress;
        this.rewardsService = new RewardsService(config);
    }

    async init() {
        await this.rewardsService.init();
    }

    transferFundsToCustomer(event) {
        const self = this;
        return new Promise(async (resolve) => {
            const usersWallet = await self.rewardsService.getApi( event.platform, event.users.destination.id );
            const isNew = usersWallet.isNew;
            const userAddress = usersWallet.getAddress();
            const response = {
                environment: self.rewardsService.environment,
                token: self.rewardsService.token,
                destination_wallet: {
                    address: userAddress,
                    is_new: isNew
                },
                unit_amount: event.payload.unit_amount
            };

            const transferResponse = await self.rewardsService.transferUnitAmount(event.platform, event.users.destination.id, event.payload.unit_amount );
            console.log('Transfer Response:' + JSON.stringify(transferResponse, null, 2));
            response.transaction = transferResponse;
            resolve(response);
        });
    }
}

module.exports.BotBusinessLogic = BotBusinessLogic;