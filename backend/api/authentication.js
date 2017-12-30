const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');
const confMgmt = require('./conf-mgmt');

const SALT_ROUNDS = 10;
const TOKENS_FILE = 'tokens.js';
const PASSWORDS_FILE = 'passwords.js';

function generateToken(userName) {
	// generating random token
	var token = uuidv4();

	// encrypting
	var encryptedToken = bcrypt.hashSync(token, SALT_ROUNDS);

	// preparing to save
	var tokenInfo = {};
	tokenInfo[userName] = encryptedToken;

	// saving in [token.js] file
	confMgmt.save(tokenInfo, TOKENS_FILE);

	return token;
}

function isTokenValid(userName, token) {
	// loading existing token
	var data = confMgmt.load(TOKENS_FILE);

	// getting specific token for userName
	var encryptedToken = data[userName];

	// encryptedToken doesn't exist in config ?
	if (encryptedToken === undefined) {
		return false;
	}

	return bcrypt.compareSync(token, encryptedToken);
}

function removeToken(userName) {
	var tokenInfo = {};
	tokenInfo[userName] = undefined;
	confMgmt.save(tokenInfo, TOKENS_FILE);
}

function setPassword(userName, password, token) {
	// is token valid ?
	if (!isTokenValid(userName, token)) {
		throw 'Bad token';
	}

	// remove token
	removeToken(userName);

	// set the password
	var credentials = {};
	credentials[userName] = bcrypt.hashSync(password, SALT_ROUNDS);

	// saving
	confMgmt.save(credentials, PASSWORDS_FILE);
}

function changePassword(userName, currentPassword, newPassword) {
	if (!confMgmt.load(PASSWORDS_FILE)[userName]) {
		throw 'User doesn\'t exist';
	}

	if (!isPasswordValid(userName, currentPassword)) {
		throw 'Bad current password';
	}

	// set the password
	var credentials = {};
	credentials[userName] = bcrypt.hashSync(newPassword, SALT_ROUNDS);

	// saving
	confMgmt.save(credentials, PASSWORDS_FILE);
}

function isPasswordValid(userName, password) {
	var encrypedPasswprd = confMgmt.load(PASSWORDS_FILE)[userName];
	if (encrypedPasswprd === undefined) {
		return false;
	}

	return bcrypt.compareSync(password, encrypedPasswprd);
}

function getUsersList() {
	var users = confMgmt.load(PASSWORDS_FILE);
	return Object.keys(users);
}

function deleteUser(userName) {
	removeToken(userName);

	var credentials = {};
	credentials[userName] = undefined;
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
