const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const settings = require('./settings');
const logger = require('./logger');

const UNAUTHORIZED_USERNAME = 'unauthorized';
const ADMIN_USERNAME = 'admin';

function generateRandomBytes(length) {
	return crypto.randomBytes(length).toString('hex');
}

function resolveUsername(req) {
	const credentials = req.session.credentials;
	if (!credentials) {
		return UNAUTHORIZED_USERNAME;
	}

	return credentials.username;
}

function sendError(res, msg) {
	res.statusMessage = msg;
	res.status(500).end();
}

function initNexlSourcesDir() {
	const nexlSourcesDir = settings.get(settings.NEXL_SOURCES_DIR);

	// is nexl sources dir exists ?
	if (fs.existsSync(nexlSourcesDir)) {
		if (fs.lstatSync(nexlSourcesDir).isDirectory()) {
			logger.log.debug('The [%s] nexl sources directory exists', nexlSourcesDir);
		} else {
			logger.log.warn('The [%s] nexl sources directory points to a file !', nexlSourcesDir);
		}
		return;
	}

	// creating nexl sources dir
	logger.log.debug('The [%s] nexl sources directory doesn\'t exist. Creating...', nexlSourcesDir);
	fs.mkdirSync(nexlSourcesDir);

	// adding examples
	logger.log.debug('Adding examples.js files to nexl sources dir');
	const examplesSrc = '../backend/resources/examples.js';
	const examplesDest = path.join(nexlSourcesDir, 'examples.js');
	const examples = fs.readFileSync(examplesSrc, 'UTF-8');
	fs.writeFileSync(examplesDest, examples, 'UTF-8');
}


// --------------------------------------------------------------------------------
module.exports.UNAUTHORIZED_USERNAME = UNAUTHORIZED_USERNAME;
module.exports.ADMIN_USERNAME = ADMIN_USERNAME;

module.exports.generateRandomBytes = generateRandomBytes;
module.exports.resolveUsername = resolveUsername;
module.exports.sendError = sendError;
module.exports.initNexlSourcesDir = initNexlSourcesDir;
// --------------------------------------------------------------------------------
