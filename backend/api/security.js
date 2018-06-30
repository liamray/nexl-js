const confMgmt = require('./conf-mgmt');
const utils = require('./utils');
const bcrypt = require('./bcryptx');
const logger = require('./logger');
const ldapUtils = require('./ldap-utils');

const READ_PERMISSION = 'read';
const WRITE_PERMISSION = 'write';

const TOKEN_VALID_HOURS = 24;

function isAdminInner(user) {
	return confMgmt.getCached(confMgmt.CONF_FILES.ADMINS).indexOf(user) >= 0;
}

function isAdmin(user) {
	const loggedInUsername = (user === utils.GUEST_USER) ? utils.GUEST_USER : utils.AUTHENTICATED;
	return isAdminInner(utils.GUEST_USER) || isAdminInner(loggedInUsername) || isAdminInner(user);
}

function retrievePermission(permission, type) {
	if (permission === undefined) {
		return false;
	}

	const result = permission[type];
	if (result === undefined) {
		return false;
	}

	return result;
}

// type is a permission type ( for example 'read' | 'write' )
// value is the expected value to check
function hasPermission(user, type) {
	if (isAdmin(user)) {
		return true;
	}

	const permissions = confMgmt.getCached(confMgmt.CONF_FILES.PERMISSIONS);

	// permission for [guest] user
	const guestUserPermission = permissions[utils.GUEST_USER];

	// permissions for [loggedin] user
	let loggedInUserPermission = (user === utils.GUEST_USER) ? permissions[utils.GUEST_USER] : permissions[utils.AUTHENTICATED];

	// permissions for [user]
	const userPermission = permissions[user];

	// summarizing all permissions
	return retrievePermission(guestUserPermission, type) || retrievePermission(loggedInUserPermission, type) || retrievePermission(userPermission, type);
}

function hasReadPermission(user) {
	return hasPermission(user, READ_PERMISSION);
}

function hasWritePermission(user) {
	return hasPermission(user, WRITE_PERMISSION);
}

function status(user) {
	return {
		isAdmin: isAdmin(user),
		hasReadPermission: isAdmin(user) || hasReadPermission(user),
		hasWritePermission: isAdmin(user) || hasWritePermission(user)
	};
}

function isValidToken(username, userObj, token) {
	// is user exists ?
	if (userObj === undefined) {
		return false;
	}

	// is same token ?
	if (userObj.token2ResetPassword.token !== token) {
		return false;
	}

	// is token expired ?
	let tokenCreated = Date.parse(userObj.token2ResetPassword.created);
	if (tokenCreated !== tokenCreated) { // is NaN ?
		logger.log.error(`Failed to parse token creation date [${userObj.token2ResetPassword.created}] for [${username}] user`);
		return false;
	}

	return tokenCreated + TOKEN_VALID_HOURS * 60 * 60 * 1000 > new Date().getTime();
}

function resetPassword(username, password, token) {
	let users = confMgmt.getCached(confMgmt.CONF_FILES.USERS);
	const userObj = users[username];

	if (!isValidToken(username, userObj, token)) {
		return Promise.reject('Bad token');
	}

	// token was applied, removing it
	delete userObj.token2ResetPassword.created;
	delete userObj.token2ResetPassword.token;

	// generating new hash for password
	return bcrypt.hash(password)
		.then((hash) => {
			userObj.password = hash;
			return confMgmt.save(users, confMgmt.CONF_FILES.USERS);
		});
}

function changePassword(username, currentPassword, newPassword) {
	const users = confMgmt.getCached(confMgmt.CONF_FILES.USERS);
	const user = users[username];
	if (user === undefined) {
		logger.log.error(`Change password action is rejected because [${username}] user doesn't exist`);
		return Promise.reject('Bad credentials');
	}

	// checking for existing password
	return bcrypt.compare(currentPassword, user.password)
		.then((isValid) => {
			if (!isValid) {
				logger.log.error(`Change password action is rejected. Reason : bad existing password for [${username}] user`);
				return Promise.reject('Bad existing password');
			}

			// creating new hash
			return bcrypt.hash(newPassword)
				.then((hash) => {
					user.password = hash;
					return confMgmt.save(users, confMgmt.CONF_FILES.USERS);
				});
		});
}

function isPasswordValid(username, password) {
	const users = confMgmt.getCached(confMgmt.CONF_FILES.USERS);
	const user = users[username];

	// is user present in password.js file ?
	if (user !== undefined) {
		logger.log.debug(`The [${username}] user is a nexl internal user. Validating password`);
		if (user.password === undefined) {
			return Promise.reject('Bad credentials');
		}
		return bcrypt.compare(password, user.password);
	}

	// no LDAP ? good bye
	const ldapSettings = confMgmt.getLDAPSettings();
	if (ldapSettings === undefined) {
		return Promise.resolve(false);
	}

	logger.log.debug('The [%s] user is not present in nexl internal directory. Trying to authenticate via LDAP', username);

	const opts = {
		ldap: ldapSettings,
		username: username,
		password: password
	};

	return ldapUtils(opts).then(
		_ => Promise.resolve(true)
	).catch(
		_ => Promise.resolve(false)
	);
}

// --------------------------------------------------------------------------------
module.exports.isAdmin = isAdmin;
module.exports.hasReadPermission = hasReadPermission;
module.exports.hasWritePermission = hasWritePermission;
module.exports.status = status;

module.exports.resetPassword = resetPassword;
module.exports.changePassword = changePassword;
module.exports.isPasswordValid = isPasswordValid;

module.exports.TOKEN_VALID_HOURS = TOKEN_VALID_HOURS;
// --------------------------------------------------------------------------------
