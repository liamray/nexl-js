const uuidv4 = require('uuid/v4');

const confMgmt = require('./conf-mgmt');
const bcrypt = require('./bcryptx');

const READ_PERMISSION = 'read';
const WRITE_PERMISSION = 'write';

function isAdmin(user) {
	return confMgmt.loadAsync(confMgmt.CONF_FILES.ADMINS).then((admins) => {
		return Promise.resolve(admins.indexOf(user) >= 0);
	});
}

// type is a permission type ( for example 'read' | 'write' )
// value is the expected value to check
function hasPermission(user, type, value) {
	return isAdmin(user).then((isAdmin) => {
		if (isAdmin) {
			return Promise.resolve(true);
		}

		return confMgmt.loadAsync(confMgmt.CONF_FILES.PERMISSIONS).then((permissions) => {
			return Promise.resolve(permissions[user] && permissions[user][type] === value);
		});
	});
}

function hasReadPermission(user) {
	return hasPermission(user, READ_PERMISSION, true);
}

function hasWritePermission(user) {
	return hasPermission(user, WRITE_PERMISSION, true);
}

function status(user) {
	return isAdmin(user).then((isAdmin) => {
		return confMgmt.loadAsync(confMgmt.CONF_FILES.PERMISSIONS).then((permissions) => {
			return Promise.resolve({
				isAdmin: isAdmin,
				hasReadPermission: isAdmin || ( permissions[user] && permissions[user][READ_PERMISSION] === true ),
				hasWritePermission: isAdmin || ( permissions[user] && permissions[user][WRITE_PERMISSION] === true )
			});
		});
	});
}

function generateTokenAndSave(username) {
	const token = uuidv4();
	return confMgmt.loadAsync(confMgmt.CONF_FILES.TOKENS).then((tokens) => {
		tokens[username] = token;
		return confMgmt.saveAsync(tokens, confMgmt.CONF_FILES.TOKENS).then(() => Promise.resolve(token));
	});
}

function resetPasswordInner(username, password, tokens) {
	// removing token
	return confMgmt.saveAsync(tokens, confMgmt.CONF_FILES.TOKENS).then(() => Promise.resolve(confMgmt.CONF_FILES.PASSWORDS)).then((passwords) => {
		return bcrypt.hash(password).then((hash) => {
			passwords[username] = hash;
			return confMgmt.saveAsync(passwords, confMgmt.CONF_FILES.PASSWORDS);
		});
	});
}

function resetPassword(username, password, token) {
	return confMgmt.loadAsync(confMgmt.CONF_FILES.TOKENS).then((tokens) => {
		if (tokens[username] === undefined) {
			return Promise.reject('Bad token');
		}

		delete tokens[username];
		return resetPasswordInner(username, password, tokens);
	});
}

function changePassword(username, currentPassword, newPassword) {
	return confMgmt.loadAsync(confMgmt.CONF_FILES.PASSWORDS).then((passwords) => {
		if (!passwords[username]) {
			return Promise.reject('User doesn\'t exist');
		}

		return isPasswordValid(username, currentPassword).then((isValid) => {
			if (!isValid) {
				return Promise.reject('Wrong current password');
			}

			// set the password
			return bcrypt.hash(newPassword).then((hash) => {
				passwords[username] = hash;
				return confMgmt.saveAsync(passwords, confMgmt.CONF_FILES.PASSWORDS);
			});
		});
	});
}

function isPasswordValid(username, password) {
	return confMgmt.loadAsync(confMgmt.CONF_FILES.PASSWORDS).then((passwords) => {
		const encryptedPassword = passwords[username];
		if (encryptedPassword === undefined) {
			return Promise.resolve(false);
		}

		return bcrypt.compare(password, encryptedPassword);
	});
}

function resolveStatus() {

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
