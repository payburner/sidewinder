import TradingMetadataService from "./TradingMetadataService";
import TradingMetadataUIService from "./TradingMetadataUIService";

export default class CoreTradingService {
    constructor( ) {
        this.mdService = new TradingMetadataService();
        this.mdUIService = new TradingMetadataUIService(this.mdService);
    }

    tradingMetaDataService = function () {
        return this.mdService;
    }

    tradingMetaDataUIService = function () {
        return this.mdUIService;
    }
}