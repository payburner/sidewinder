import TradingMetadataService from "./TradingMetadataService";
import TradingMetadataUIService from "./TradingMetadataUIService";
import TradingOrdersService from "./TradingOrdersService";
import TradingBalancesService from "./TradingBalancesService";

export default class CoreTradingService {
    constructor( tokenService ) {
        this.authTokenService = tokenService
        this.mdService = new TradingMetadataService();
        this.mdUIService = new TradingMetadataUIService(this.mdService);
        this.ordersService = new TradingOrdersService( tokenService );
        this.balancesService = new TradingBalancesService( tokenService );
    }

    tokenService = function() {
        return this.authTokenService;
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

    tradingBalancesService = function () {
        return this.balancesService;
    }
}