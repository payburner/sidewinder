import TradingMetadataService from "./TradingMetadataService";
import TradingMetadataUIService from "./TradingMetadataUIService";
import TradingOrdersService from "./TradingOrdersService";

export default class CoreTradingService {
    constructor( ) {
        this.mdService = new TradingMetadataService();
        this.mdUIService = new TradingMetadataUIService(this.mdService);
        this.ordersService = new TradingOrdersService();
    }

    tradingMetaDataService = function () {
        return this.mdService;
    }

    tradingMetaDataUIService = function () {
        return this.mdUIService;
    }

    tradingOrdersService = function () {
        return this.ordersService;
    }
}