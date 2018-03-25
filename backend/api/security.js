const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');

const confMgmt = require('./conf-mgmt');

const READ_PERMISSION = 'read';
const WRITE_PERMISSION = 'write';
const SALT_ROUNDS = 10;

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

function generateToken() {
	return uuidv4();
}

function setPassword(username, password, token) {
	// is token exists ?
	const tokens = confMgmt.load(confMgmt.CONF_FILES.TOKENS);
	if (tokens[username] !== token) {
		throw 'Bad token';
	}

	// removing token
	delete tokens[username];
	confMgmt.save(tokens, confMgmt.CONF_FILES.TOKENS);

	// set the password
	const passwords = confMgmt.load(confMgmt.CONF_FILES.SETTINGS);
	passwords[username] = bcrypt.hashSync(password, SALT_ROUNDS);

	// saving
	confMgmt.save(passwords, confMgmt.CONF_FILES.PASSWORDS);
}

function changePassword(username, currentPassword, newPassword) {
	const passwords = confMgmt.load(confMgmt.CONF_FILES.PASSWORDS);

	if (!passwords[username]) {
		throw 'User doesn\'t exist';
	}

	if (!isPasswordValid(username, currentPassword)) {
		throw 'Bad current password';
	}

	// set the password
	passwords[username] = bcrypt.hashSync(newPassword, SALT_ROUNDS);

	// saving
	confMgmt.save(passwords, confMgmt.CONF_FILES.PASSWORDS);
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
	const passwords = confMgmt.load(confMgmt.CONF_FILES.PASSWORDS);
	const index = passwords.indexOf(username);
	if (index < 0) {
		return;
	}
	passwords.splice(index, 1);
	confMgmt.save(passwords, confMgmt.CONF_FILES.PASSWORDS);
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
