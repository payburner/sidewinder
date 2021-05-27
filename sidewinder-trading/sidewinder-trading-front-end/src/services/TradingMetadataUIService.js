export default class TradingMetadataUIService {


    constructor( tradingMetadataService ) {
        this.tradingMetadataService = tradingMetadataService;
        this.noSymbols = [
            'USDC','GUSD','PAX','DAI','MKR','LINK'
        ]
    }

    assetIconClass = function ( asset, size ) {
        const assetType = this.tradingMetadataService.assetType( asset );
        if (assetType === 'FIAT') {
           return 'fiat-icon-' + size + ' fa fa-' + asset.toLowerCase();
        }
        else if (this.noSymbols.indexOf(asset) > -1) {
            return 'fiat-icon-' + size + ' fa fa-coin';
        }
        else {
            return 'cc ' + asset;
        }
    }
}