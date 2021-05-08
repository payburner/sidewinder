"use strict";

var _require = require("@payburner/keyburner-core/dist/npm"),
    KeyBurner = _require.KeyBurner;

var keyburner = new KeyBurner();
var seed = keyburner.generateSeed();
var keyPair = keyburner.deriveKeyPair(seed);
var address = keyburner.deriveAddress(keyPair);

console.log(JSON.stringify({
    address: address, secret: seed
}, null, 2));