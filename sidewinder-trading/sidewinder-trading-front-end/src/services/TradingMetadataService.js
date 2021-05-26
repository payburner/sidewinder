
export default class TradingMetadataService {

    constructor() {
    }

    assetType = function ( currency ) {
        if (currency === 'USD' || currency === 'GBP' || currency === 'EUR') {
            return 'FIAT';
        }
        else {
            return 'CRYPTO';
        }
    }
}