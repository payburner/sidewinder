const {KeyBurner, KeyPair, SignedTransaction} = require( "@payburner/keyburner-core/dist/npm");

 class Api {
    constructor() {
        this.keyburner = new KeyBurner();
    }

    keyburner = null;
    keyPair = null;
    address = null;
    seed = null;

    newAddress() {
        this.seed = this.keyburner.generateSeed();
        this.keyPair = this.keyburner.deriveKeyPair(this.seed);
        this.address = this.keyburner.deriveAddress(this.keyPair);
    }

    initializeAddress(seed) {
        this.seed = seed;
        this.keyPair = this.keyburner.deriveKeyPair(seed);
        this.address = this.keyburner.deriveAddress(this.keyPair);
    }

    signTokenCreateRequest(createTokenRequest ) {
        return this.keyburner.signTransaction(createTokenRequest, this.keyPair);
    }

    signTransferRequest(createTokenRequest ) {
        return this.keyburner.signTransaction(createTokenRequest, this.keyPair);
    }

    getAddress() {
        return this.address;
    }

    signTokenUpdateRequest(updateTokenRequest ) {
        return this.keyburner.signTransaction(updateTokenRequest, this.keyPair);
    }

    signTokenUpdateTokenAccountRequest(updateTokenAccountTransaction )  {
        return this.keyburner.signTransaction(updateTokenAccountTransaction, this.keyPair);
    }
}

module.exports = {Api};
