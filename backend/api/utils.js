const crypto = require('crypto');

const UNAUTHORIZED_USERNAME = 'unauthorized';

function generateRandomBytes(length) {
	return crypto.randomBytes(length).toString('hex');
}

function resolveUsername(req) {
	var credentials = req.session.credentials;
	if (!credentials) {
		return UNAUTHORIZED_USERNAME;
	}

	return credentials.username;
}

function sendError(res, msg) {
	res.statusMessage = msg;
	res.status(500).end();
}

// --------------------------------------------------------------------------------
module.exports.generateRandomBytes = generateRandomBytes;
module.exports.resolveUsername = resolveUsername;
module.exports.sendError = sendError;
// --------------------------------------------------------------------------------
