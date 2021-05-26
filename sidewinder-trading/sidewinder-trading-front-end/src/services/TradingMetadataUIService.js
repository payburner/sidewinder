export default class TradingMetadataUIService {

    constructor( tradingMetadataService ) {
        this.tradingMetadataService = tradingMetadataService;
    }

    assetIconClass = function ( asset, size ) {
        const assetType = this.tradingMetadataService.assetType( asset );
        if (assetType === 'FIAT') {
           return 'fiat-icon-' + size + ' fa fa-' + asset.toLowerCase();
        }
        else {
            return 'cc ' + asset;
        }
    }
}