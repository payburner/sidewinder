'use strict';
const {KeyBurner} = require("@payburner/keyburner-core/dist/npm");

module.exports.process = async event => {

    const keyburner = new KeyBurner();
    const seed = keyburner.generateSeed();
    const keyPair = keyburner.deriveKeyPair(seed);
    const address = keyburner.deriveAddress(keyPair);
    return {
        statusCode: 200, body: JSON.stringify({
            address: address, secret: seed
        })
    };
};

