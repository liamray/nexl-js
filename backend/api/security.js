const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');

const confMgmt = require('./conf-mgmt');

const READ_PERMISSION = 'read';
const WRITE_PERMISSION = 'write';
const EXTERNAL_INCLUDES_PERMISSION = 'externalIncludes';

function isAdmin(user) {
	const admins = confMgmt.load(confMgmt.CONF_FILES.ADMINS);
	return admins && admins.indexOf(user) >= 0;
}

function hasPermission(user, permissionType, resource) {
	if (isAdmin(user)) {
		return true;
	}

	const entities = [user];

	// loading permissions matrix
	const permissions = confMgmt.load(confMgmt.CONF_FILES.PERMISSIONS);

	// iterating over permissions and checking
	let result = false;
	for (let entity in permissions) {
		// is user or group present in permission matrix ?
		if (entities.indexOf(entity) < 0) {
			continue;
		}

		const permission = permissions[entity];
		const permissionValue = permission[permissionType];
		if (permissionValue !== undefined) {
			result = result || permissionValue;
		}
	}

	return result;
}

function hasReadPermission(user) {
	return hasPermission(user, READ_PERMISSION);
}

function hasWritePermission(user) {
	return hasPermission(user, WRITE_PERMISSION);
}

const SALT_ROUNDS = 10;

function generateToken(username) {
	// generating random token
	const token = uuidv4();

	// encrypting
	const encryptedToken = bcrypt.hashSync(token, SALT_ROUNDS);

	// preparing to save
	const tokenInfo = {};
	tokenInfo[username] = encryptedToken;

	// saving in [token.js] file
	confMgmt.save(tokenInfo, confMgmt.CONF_FILES.TOKENS);

	return token;
}

function isTokenValid(username, token) {
	// loading existing token
	const data = confMgmt.load(confMgmt.CONF_FILES.TOKENS);

	// getting specific token for username
	const encryptedToken = data[username];

	// encryptedToken doesn't exist in config ?
	if (encryptedToken === undefined) {
		return false;
	}

	return bcrypt.compareSync(token, encryptedToken);
}

function removeToken(username) {
	const tokenInfo = {};
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
	const credentials = {};
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
	const credentials = {};
	credentials[username] = bcrypt.hashSync(newPassword, SALT_ROUNDS);

	// saving
	confMgmt.save(credentials, confMgmt.CONF_FILES.PASSWORDS);
}

function isPasswordValid(username, password) {
	const encryptedPassword = confMgmt.load(confMgmt.CONF_FILES.PASSWORDS)[username];
	if (encryptedPassword === undefined) {
		return false;
	}

	return bcrypt.compareSync(password, encryptedPassword);
}

function getUsersList() {
	const users = confMgmt.load(confMgmt.CONF_FILES.PASSWORDS);
	return Object.keys(users);
}

function deleteUser(username) {
	removeToken(username);

	const credentials = {};
	credentials[username] = undefined;
	confMgmt.save(credentials, confMgmt.CONF_FILES.PASSWORDS);
}


// --------------------------------------------------------------------------------
module.exports.isAdmin = isAdmin;
module.exports.hasReadPermission = hasReadPermission;
module.exports.hasWritePermission = hasWritePermission;

module.exports.generateToken = generateToken;
module.exports.setPassword = setPassword;
module.exports.changePassword = changePassword;
module.exports.isPasswordValid = isPasswordValid;
module.exports.getUsersList = getUsersList;
module.exports.deleteUser = deleteUser;
// --------------------------------------------------------------------------------
