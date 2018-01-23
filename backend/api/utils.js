const crypto = require('crypto');

function generateRandomBytes(length) {
    return crypto.randomBytes(length).toString('hex');
}

// --------------------------------------------------------------------------------
module.exports.generateRandomBytes = generateRandomBytes;
// --------------------------------------------------------------------------------
