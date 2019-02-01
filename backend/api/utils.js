const crypto = require('crypto');
const uuidv4 = require('uuid/v4');
const j79 = require('j79-utils');
const commonUtils = require('../common/common-utils');

function generateRandomBytes(length) {
	return crypto.randomBytes(length).toString('hex');
}

// format error in order to print it in console.log() as a part of error message : console.log('Error occurred. Reason : [%s]', formattedError);
function formatErr(err) {
	if (err === undefined) {
		return '';
	}

	if (err.message !== undefined || err.stack !== undefined) {
		return ( err.message || '' ) + '\n' + ( err.stack || '' );
	}

	// not an object ? nothing to do with it
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

function generateNewToken() {
	return {
		token: uuidv4(),
		created: commonUtils.formatDate()
	};
}


// --------------------------------------------------------------------------------
module.exports.generateRandomBytes = generateRandomBytes;

module.exports.formatErr = formatErr;
module.exports.isNotEmptyStr = isNotEmptyStr;
module.exports.isEmptyStr = isEmptyStr;

module.exports.isFilePathValid = isFilePathValid;
module.exports.isDirPathValid = isDirPathValid;

module.exports.generateNewToken = generateNewToken;
// --------------------------------------------------------------------------------
