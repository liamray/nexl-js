const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');
const confMgmt = require('./conf-mgmt');

const SALT_ROUNDS = 10;
const TOKENS_FILE = 'tokens.js';
const PASSWORDS_FILE = 'passwords.js';

function generateToken(username) {
	// generating random token
	var token = uuidv4();

	// encrypting
	var encryptedToken = bcrypt.hashSync(token, SALT_ROUNDS);

	// preparing to save
	var tokenInfo = {};
	tokenInfo[username] = encryptedToken;

	// saving in [token.js] file
	confMgmt.save(tokenInfo, TOKENS_FILE);

	return token;
}

function isTokenValid(username, token) {
	// loading existing token
	var data = confMgmt.load(TOKENS_FILE);

	// getting specific token for username
	var encryptedToken = data[username];

	// encryptedToken doesn't exist in config ?
	if (encryptedToken === undefined) {
		return false;
	}

	return bcrypt.compareSync(token, encryptedToken);
}

function removeToken(username) {
	var tokenInfo = {};
	tokenInfo[username] = undefined;
	confMgmt.save(tokenInfo, TOKENS_FILE);
}

function setPassword(username, password, token) {
	// is token valid ?
	if (!isTokenValid(username, token)) {
		throw 'Bad token';
	}

	// remove token
	removeToken(username);

	// set the password
	var credentials = {};
	credentials[username] = bcrypt.hashSync(password, SALT_ROUNDS);

	// saving
	confMgmt.save(credentials, PASSWORDS_FILE);
}

function changePassword(username, currentPassword, newPassword) {
	if (!confMgmt.load(PASSWORDS_FILE)[username]) {
		throw 'User doesn\'t exist';
	}

	if (!isPasswordValid(username, currentPassword)) {
		throw 'Bad current password';
	}

	// set the password
	var credentials = {};
	credentials[username] = bcrypt.hashSync(newPassword, SALT_ROUNDS);

	// saving
	confMgmt.save(credentials, PASSWORDS_FILE);
}

function isPasswordValid(username, password) {
	var encrypedPasswprd = confMgmt.load(PASSWORDS_FILE)[username];
	if (encrypedPasswprd === undefined) {
		return false;
	}

	return bcrypt.compareSync(password, encrypedPasswprd);
}

function getUsersList() {
	var users = confMgmt.load(PASSWORDS_FILE);
	return Object.keys(users);
}

function deleteUser(username) {
	removeToken(username);

	var credentials = {};
	credentials[username] = undefined;
	confMgmt.save(credentials, PASSWORDS_FILE);
}

// --------------------------------------------------------------------------------
module.exports.generateToken = generateToken;
module.exports.setPassword = setPassword;
module.exports.changePassword = changePassword;
module.exports.isPasswordValid = isPasswordValid;
module.exports.getUsersList = getUsersList;
module.exports.deleteUser = deleteUser;
// --------------------------------------------------------------------------------
