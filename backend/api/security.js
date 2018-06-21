const uuidv4 = require('uuid/v4');

const confMgmt = require('./conf-mgmt');
const utils = require('./utils');
const bcrypt = require('./bcryptx');
const logger = require('./logger');

const READ_PERMISSION = 'read';
const WRITE_PERMISSION = 'write';

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

function generateTokenAndSave(username) {
	const token = uuidv4();
	const tokens = confMgmt.getCached(confMgmt.CONF_FILES.TOKENS);
	tokens[username] = token;
	return confMgmt.save(tokens, confMgmt.CONF_FILES.TOKENS).then(
		() => Promise.resolve(token)
	);
}

function resetPassword(username, password, token) {
	const tokens = confMgmt.getCached(confMgmt.CONF_FILES.TOKENS);
	if (tokens[username] !== token) {
		return Promise.reject('Bad token');
	}

	// token was applied, removing it
	delete tokens[username];

	// and storing
	return confMgmt.save(tokens, confMgmt.CONF_FILES.TOKENS).then(
		() => {
			// loading existing passwords table
			const passwords = confMgmt.getCached(confMgmt.CONF_FILES.PASSWORDS);
			// generating new hash
			return bcrypt.hash(password).then(
				(hash) => {
					passwords[username] = hash;
					// updating passwords
					return confMgmt.save(passwords, confMgmt.CONF_FILES.PASSWORDS);
				});
		}
	);
}

function changePassword(username, currentPassword, newPassword) {
	const passwords = confMgmt.getCached(confMgmt.CONF_FILES.PASSWORDS);
	if (!passwords[username]) {
		return Promise.reject('User doesn\'t exist');
	}

	return isPasswordValid(username, currentPassword).then(
		(isValid) => {
			if (!isValid) {
				return Promise.reject('Wrong current password');
			}

			// updating hash
			return bcrypt.hash(newPassword).then(
				(hash) => {
					passwords[username] = hash;
					return confMgmt.save(passwords, confMgmt.CONF_FILES.PASSWORDS);
				});
		});
}

function findLDAPUser(username) {
	return new Promise(
		(resolve, reject) => {
			confMgmt.getADObject().findUser(username, true, (err, user) => {
				if (err) {
					logger.log.error('LDAP error. Reason : %s', utils.formatErr(err));
					reject('Internal LDAP error');
					return;
				}

				if (!user) {
					logger.log.error('The [%s] user was not found in LDAP', username);
					resolve(undefined);
					return;
				}

				resolve(user);
			});
		}
	);
}

function authenticateLDAPUser(username, password) {
	return new Promise(
		(resolve, reject) => {
			confMgmt.getADObject().authenticate(username, password, (err, auth) => {
				if (err) {
					logger.log.error('LDAP error. Reason : %s', utils.formatErr(err));
					reject('Internal LDAP error');
					return;
				}

				if (auth) {
					logger.log.debug('The [%s] user is successfully authenticated via LDAP', username);
					resolve(true);
				} else {
					logger.log.error('Bad password for [%s] user', username);
					reject(false);
				}
			});
		}
	);
}

function isPasswordValid(username, password) {
	const passwords = confMgmt.getCached(confMgmt.CONF_FILES.PASSWORDS);
	const hash = passwords[username];

	// is user present in password.js file ?
	if (hash !== undefined) {
		logger.log.debug('The [%s] user is present in nexl internal directory', username);
		return bcrypt.compare(password, hash);
	}

	if (confMgmt.getADObject() === undefined) {
		return Promise.resolve(false);
	}

	logger.log.debug('The [%s] user is not present in nexl internal directory. Trying to authenticate via LDAP', username);

	// searching user in LDAP
	return findLDAPUser(username)
		.then(user => {
			if (user === undefined) {
				logger.log.debug('The [%s] user not found via LDAP', username);
				return Promise.resolve(false);
			}

			// authenticating user in LDAP
			return authenticateLDAPUser(user.userPrincipalName, password);
		});
}

// --------------------------------------------------------------------------------
module.exports.isAdmin = isAdmin;
module.exports.hasReadPermission = hasReadPermission;
module.exports.hasWritePermission = hasWritePermission;
module.exports.status = status;

module.exports.generateTokenAndSave = generateTokenAndSave;
module.exports.resetPassword = resetPassword;
module.exports.changePassword = changePassword;
module.exports.isPasswordValid = isPasswordValid;
// --------------------------------------------------------------------------------
