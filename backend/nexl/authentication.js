const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');
const settings = require('./settings');

const SALT_ROUNDS = 10;
const TOKENS_FILE = 'tokens.js';
const PASSWORDS_FILE = 'passwords.js';

function generateNewToken(userName) {
	// generating random token
	var token = uuidv4();

	// encrypting
	var encryptedToken = bcrypt.hashSync(token, SALT_ROUNDS);

	// preparing to save
	var tokenInfo = {};
	tokenInfo[userName] = encryptedToken;

	// saving in [token.js] file
	settings.save(tokenInfo, TOKENS_FILE);

	return token;
}

function isTokenValid(userName, token) {
	// loading existing token
	var data = settings.load(TOKENS_FILE);

	// getting specific token for userName
	var encryptedToken = data[userName];

	// encryptedToken doesn't exist in settings ?
	if (encryptedToken === undefined) {
		return false;
	}

	return bcrypt.compareSync(token, encryptedToken);
}

function removeToken(userName) {
	var tokenInfo = {};
	tokenInfo[userName] = undefined;
	settings.save(tokenInfo, TOKENS_FILE);
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
	settings.save(credentials, PASSWORDS_FILE);
}

function isPasswordValid(userName, password) {
	var encrypedPasswprd = settings.load(PASSWORDS_FILE)[userName];
	if (encrypedPasswprd === undefined) {
		return false;
	}

	return bcrypt.compareSync(password, encrypedPasswprd);
}

function deleteUser(userName) {
	removeToken(userName);

	var credentials = {};
	credentials[userName] = undefined;
	settings.save(credentials, PASSWORDS_FILE);
}

// --------------------------------------------------------------------------------
module.exports.generateNewToken = generateNewToken;
module.exports.setPassword = setPassword;
module.exports.isPasswordValid = isPasswordValid;
module.exports.deleteUser = deleteUser;
// --------------------------------------------------------------------------------
