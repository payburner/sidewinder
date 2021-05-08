const {KeyBurner} = require("@payburner/keyburner-core/dist/npm");

const keyburner = new KeyBurner();
const seed = keyburner.generateSeed();
const keyPair = keyburner.deriveKeyPair(seed);
const address = keyburner.deriveAddress(keyPair);

console.log(JSON.stringify({
    address: address, secret: seed
}, null, 2));