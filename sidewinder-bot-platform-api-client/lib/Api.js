"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("@payburner/keyburner-core/dist/npm"),
    KeyBurner = _require.KeyBurner;

var Api = function () {
    function Api() {
        _classCallCheck(this, Api);

        this.keyburner = new KeyBurner();
        this.keyPair = null;
        this.address = null;
        this.isNew = false;
        this.seed = null;
        this.platform = null;
        this.screenName = null;
    }

    _createClass(Api, [{
        key: "newAddress",
        value: function newAddress() {
            this.seed = this.keyburner.generateSeed();
            this.keyPair = this.keyburner.deriveKeyPair(this.seed);
            this.address = this.keyburner.deriveAddress(this.keyPair);
            this.isNew = true;
        }
    }, {
        key: "initializeAddress",
        value: function initializeAddress(seed) {
            this.seed = seed;
            this.keyPair = this.keyburner.deriveKeyPair(seed);
            this.address = this.keyburner.deriveAddress(this.keyPair);
            this.isNew = false;
        }
    }, {
        key: "sign",
        value: function sign(createTokenRequest) {
            return this.keyburner.signTransaction(createTokenRequest, this.keyPair);
        }
    }, {
        key: "signTransferRequest",
        value: function signTransferRequest(createTokenRequest) {
            return this.keyburner.signTransaction(createTokenRequest, this.keyPair);
        }
    }, {
        key: "getAddress",
        value: function getAddress() {
            return this.address;
        }
    }, {
        key: "signTokenUpdateRequest",
        value: function signTokenUpdateRequest(updateTokenRequest) {
            return this.keyburner.signTransaction(updateTokenRequest, this.keyPair);
        }
    }, {
        key: "signTokenUpdateTokenAccountRequest",
        value: function signTokenUpdateTokenAccountRequest(updateTokenAccountTransaction) {
            return this.keyburner.signTransaction(updateTokenAccountTransaction, this.keyPair);
        }
    }]);

    return Api;
}();

module.exports.Api = Api;