const crypto = require('crypto');
const jwt = require('jwt-simple');
const uuidv4 = require('uuid/v4');
const j79 = require('j79-utils');
const path = require('path');

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

function sendError(res, msg, httpStatus) {
	httpStatus = httpStatus ? httpStatus : 500;
	res.statusMessage = msg;
	res.status(httpStatus).end();
}

function formatErr(err) {
	if (j79.getType(err) === '[object Error]') {
		return err.message + '\n' + err.stack;
	}

	if (!j79.isObject(err)) {
		return err;
	}

	if (Object.keys(err).length < 1) {
		return err;
	}

	return JSON.stringify(err, null, 2);
}

function isNotEmptyStr(str) {
	return str !== undefined && str !== null && str.toString().length > 0;
}

function isEmptyStr(str) {
	return str === undefined || str === null || str.toString().length < 1;
}

const BAD_DIR_PATH_REGEX = '([\\\\/]\\.?[\\\\|/])|(\\.{2,})|(\\.+$)';
const BAD_FILE_PATH_REGEX = BAD_DIR_PATH_REGEX + '|(^[\\\\/]*$)';

const BAD_DIR_PATH = new RegExp(BAD_DIR_PATH_REGEX);
const BAD_FILE_PATH = new RegExp(BAD_FILE_PATH_REGEX);

function isDirPathValid(relativePath) {
	return relativePath.match(BAD_DIR_PATH) === null;
}

function isFilePathValid(relativePath) {
	return relativePath.match(BAD_FILE_PATH) === null;
}


// --------------------------------------------------------------------------------
module.exports.UNAUTHORIZED_USERNAME = UNAUTHORIZED_USERNAME;
module.exports.AUTHORIZED_USERNAME = AUTHORIZED_USERNAME;
module.exports.ADMIN_USERNAME = ADMIN_USERNAME;

module.exports.generateRandomBytes = generateRandomBytes;
module.exports.getLoggedInUsername = getLoggedInUsername;
module.exports.sendError = sendError;
module.exports.encrypt = encrypt;

module.exports.formatErr = formatErr;
module.exports.isNotEmptyStr = isNotEmptyStr;
module.exports.isEmptyStr = isEmptyStr;

module.exports.isFilePathValid = isFilePathValid;
module.exports.isDirPathValid = isDirPathValid;
// --------------------------------------------------------------------------------
