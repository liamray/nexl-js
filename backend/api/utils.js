const crypto = require('crypto');
const uuidv4 = require('uuid/v4');
const j79 = require('j79-utils');

function generateRandomBytes(length) {
	return crypto.randomBytes(length).toString('hex');
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

function completeDateTime(x) {
	for (let index = 0; index < x.length; index++) {
		const item = x[index] + '';
		if (item.length < 2) {
			x[index] = `0${item}`;
		}
	}
}

function formatDate() {
	const currentDate = new Date();

	let date = [];
	let time = [];

	date.push(currentDate.getFullYear());
	date.push(currentDate.getMonth() + 1);
	date.push(currentDate.getDate());

	time.push(currentDate.getHours());
	time.push(currentDate.getMinutes());

	completeDateTime(date);
	completeDateTime(time);

	date = date.join('-');
	time = time.join(':');

	return `${date} ${time}`;
}

function generateNewToken() {
	return {
		token: uuidv4(),
		created: formatDate()
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
