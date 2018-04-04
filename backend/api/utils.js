const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const deepMerge = require('deepmerge');
const jwt = require('jwt-simple');
const uuidv4 = require('uuid/v4');
const j79 = require('j79-utils');

const confMgmt = require('./conf-mgmt');
const logger = require('./logger');

// is a password to encrypt/decrypt tokens
const SECRET = uuidv4();

const UNAUTHORIZED_USERNAME = 'unauthorized';
const AUTHORIZED_USERNAME = 'authorized';
const ADMIN_USERNAME = 'admin';

function encrypt(username) {
	return jwt.encode(username, SECRET);
}

function generateRandomBytes(length) {
	return crypto.randomBytes(length).toString('hex');
}

function getLoggedInUsername(req) {
	const token = req.headers['token'] || '';
	let username;
	try {
		username = jwt.decode(token, SECRET);
	} catch (e) {
		return UNAUTHORIZED_USERNAME;
	}

	return username;
}

function sendError(res, msg) {
	res.statusMessage = msg;
	res.status(500).end();
}

function initNexlSourcesDir() {
	const nexlSourcesDir = confMgmt.load(confMgmt.CONF_FILES.SETTINGS)[confMgmt.SETTINGS.NEXL_SOURCES_DIR];

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

	// todo : move the following code to the function ( and expose this feature to the web service : View -> Examples )
	// adding examples
	logger.log.debug('Adding examples.js files to nexl sources dir');
	const examplesSrc = '../backend/resources/examples.js';
	const examplesDest = path.join(nexlSourcesDir, 'examples.js');
	const examples = fs.readFileSync(examplesSrc, 'UTF-8');
	fs.writeFileSync(examplesDest, examples, 'UTF-8');
}

function deepMergeAndPeel(obj1, obj2) {
	// iterating over obj1 and deleting fields which not present in obj2
	for (let key in obj1) {
		if (obj2[key] === undefined) {
			delete obj1[key];
		}
	}

	return deepMerge(obj1, obj2, {
		arrayMerge: function (target, source) {
			return source.slice(0);
		}
	});
}

function formatErr(err) {
	return err.toString() + '\n' + JSON.stringify(err, null, 2);
}

// --------------------------------------------------------------------------------
module.exports.UNAUTHORIZED_USERNAME = UNAUTHORIZED_USERNAME;
module.exports.AUTHORIZED_USERNAME = AUTHORIZED_USERNAME;
module.exports.ADMIN_USERNAME = ADMIN_USERNAME;

module.exports.generateRandomBytes = generateRandomBytes;
module.exports.getLoggedInUsername = getLoggedInUsername;
module.exports.sendError = sendError;
module.exports.initNexlSourcesDir = initNexlSourcesDir;
module.exports.encrypt = encrypt;

module.exports.formatErr = formatErr;

module.exports.deepMergeAndPeel = deepMergeAndPeel;
// --------------------------------------------------------------------------------
