const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');
const confMgmt = require('./conf-mgmt');

const SALT_ROUNDS = 10;

function generateToken(username) {
	// generating random token
	var token = uuidv4();

	// encrypting
	var encryptedToken = bcrypt.hashSync(token, SALT_ROUNDS);

	// preparing to save
	var tokenInfo = {};
	tokenInfo[username] = encryptedToken;

	// saving in [token.js] file
	confMgmt.save(tokenInfo, confMgmt.CONF_FILES.TOKENS);

	return token;
}

function isTokenValid(username, token) {
	// loading existing token
	var data = confMgmt.load(confMgmt.CONF_FILES.TOKENS);

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
	confMgmt.save(tokenInfo, confMgmt.CONF_FILES.TOKENS);
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
	confMgmt.save(credentials, confMgmt.CONF_FILES.PASSWORDS);
}

function changePassword(username, currentPassword, newPassword) {
	if (!confMgmt.load(confMgmt.CONF_FILES.PASSWORDS)[username]) {
		throw 'User doesn\'t exist';
	}

	if (!isPasswordValid(username, currentPassword)) {
		throw 'Bad current password';
	}

	// set the password
	var credentials = {};
	credentials[username] = bcrypt.hashSync(newPassword, SALT_ROUNDS);

	// saving
	confMgmt.save(credentials, confMgmt.CONF_FILES.PASSWORDS);
}

function isPasswordValid(username, password) {
	var encryptedPassword = confMgmt.load(confMgmt.CONF_FILES.PASSWORDS)[username];
	if (encryptedPassword === undefined) {
		return false;
	}

	return bcrypt.compareSync(password, encryptedPassword);
}

function getUsersList() {
	var users = confMgmt.load(confMgmt.CONF_FILES.PASSWORDS);
	return Object.keys(users);
}

function deleteUser(username) {
	removeToken(username);

	var credentials = {};
	credentials[username] = undefined;
	confMgmt.save(credentials, confMgmt.CONF_FILES.PASSWORDS);
}

// --------------------------------------------------------------------------------
module.exports.generateToken = generateToken;
module.exports.setPassword = setPassword;
module.exports.changePassword = changePassword;
module.exports.isPasswordValid = isPasswordValid;
module.exports.getUsersList = getUsersList;
module.exports.deleteUser = deleteUser;
// --------------------------------------------------------------------------------
