import TradingMetadataService from "./TradingMetadataService";
import TradingMetadataUIService from "./TradingMetadataUIService";
import TradingOrdersService from "./TradingOrdersService";
import TradingBalancesService from "./TradingBalancesService";
import Level1Service from "./Level1Service";
import Level2Service from "./Level2Service";

export default class CoreTradingService {
    constructor( tokenService ) {
        this.authTokenService = tokenService
        this.mdService = new TradingMetadataService();
        this.mdUIService = new TradingMetadataUIService(this.mdService);
        this.ordersService = new TradingOrdersService( tokenService, this.mdService );
        this.balancesService = new TradingBalancesService( tokenService );
        this.l1Service = new Level1Service(tokenService, this.mdService, this.ordersService);
        this.l2Service = new Level2Service(tokenService, this.mdService, this.ordersService);
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

    level1Service = function () {
        return this.l1Service;
    }

    level2Service = function() {
        return this.l2Service;
    }
}