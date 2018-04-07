const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const deepMerge = require('deepmerge');
const jwt = require('jwt-simple');
const uuidv4 = require('uuid/v4');

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

function isNotEmptyStr(str) {
	return str !== undefined && str !== null && str.length > 0;
}

function isEmptyStr(str) {
	return str === undefined || str === null || str.length < 1;
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

module.exports.deepMergeAndPeel = deepMergeAndPeel;
// --------------------------------------------------------------------------------
