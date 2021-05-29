
export default class Level1Service {

    constructor(tokenService, tradingMetaDataService, tradingOrdersService) {
        this.tokenService = tokenService;
        this.tradingMetaDataService = tradingMetaDataService;
        this.tradingOrdersService = tradingOrdersService;
    }

    transferFunds = function( venueId, sourceCurrency, targetCurrency, amount ) {
        return new Promise(async (resolve) => {
            if (this.tradingMetaDataService.assetType(targetCurrency) === 'CRYPTO') {
                const response = await this.tradingOrdersService.placeVenueInstantOrder(venueId,
                    targetCurrency + '/' + sourceCurrency, 'buy', amount );
               resolve(response);
            }
            else {
                const response = await this.tradingOrdersService.placeVenueMarketOrder(venueId,
                    sourceCurrency + '/' + targetCurrency , 'sell', amount);
                resolve(response);
            }
        })
    }

}