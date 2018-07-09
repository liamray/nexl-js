const express = require('express');

const security = require('../../api/security');
const utils = require('../../api/utils');
const logger = require('../../api/logger');
const confMgmt = require('../../api/conf-mgmt');
const confConsts = require('../../common/conf-constants');
const securityConsts = require('../../common/security-constants');

const router = express.Router();

router.post('/enable-disable-user', function (req, res) {
	const loggedInUsername = utils.getLoggedInUsername(req);
	const username = req.body.username;
	const isDisabled = req.body.isDisabled;

	if (isDisabled === true) {
		logger.log.debug(`Disabling a [${username}] user by [${loggedInUsername}] user`);
	} else {
		logger.log.debug(`Enabling a [${username}] user by [${loggedInUsername}] user`);
	}

	// only admins can perform this action
	if (!security.isAdmin(loggedInUsername)) {
		logger.log.error('Cannot enable/disable, admin permissions required');
		utils.sendError(res, 'admin permissions required');
		return;
	}

	const users = confMgmt.getCached(confConsts.CONF_FILES.USERS);

	if (users[username] === undefined) {
		logger.log.error(`Failed to enable/disable a user [%s]. Reason : the [${username}] user doesnt exist`);
		utils.sendError(res, `User doesn't exist`);
		return;
	}

	users[username].disabled = isDisabled;

	confMgmt.save(users, confConsts.CONF_FILES.USERS)
		.then(_ => {
			res.send({});
			logger.log.debug(`Successfully enabled/disabled a [${username}] user by [${loggedInUsername}] user`);
		})
		.catch(
			(err) => {
				logger.log.error('Failed to enable/disable a user [%s]. Reason : [%s]', username, utils.formatErr(err));
				utils.sendError(res, err);
			}
		);

});

router.post('/rename-user', function (req, res) {
	const loggedInUsername = utils.getLoggedInUsername(req);
	const newUsername = req.body.newUsername;
	const oldUsername = req.body.oldUsername;

	logger.log.debug(`Renaming a [${oldUsername}] user to [${newUsername}] by [${loggedInUsername}]`);

	// only admins can perform this action
	if (!security.isAdmin(loggedInUsername)) {
		logger.log.error('Cannot create new user, admin permissions required');
		utils.sendError(res, 'admin permissions required');
		return;
	}

	const users = confMgmt.getCached(confConsts.CONF_FILES.USERS);

	// todo : validate newUsername !!!

	delete users[oldUsername];
	users[newUsername] = {};

	confMgmt.save(users, confConsts.CONF_FILES.USERS)
		.then(_ => {
			res.send({});
			logger.log.debug(`Successfully renamed a [${oldUsername}] user to [${newUsername}] by [${loggedInUsername}]`);
		})
		.catch(
			(err) => {
				logger.log.error('Failed to create a new user [%s]. Reason : [%s]', newUsername, utils.formatErr(err));
				utils.sendError(res, err);
			}
		);

});

router.post('/remove-user', function (req, res) {
	const loggedInUsername = utils.getLoggedInUsername(req);
	const username = req.body.username;

	logger.log.debug(`Removing a [${username}] user by [${loggedInUsername}] user`);

	// only admins can perform this action
	if (!security.isAdmin(loggedInUsername)) {
		logger.log.error('Cannot create new user, admin permissions required');
		utils.sendError(res, 'admin permissions required');
		return;
	}

	const users = confMgmt.getCached(confConsts.CONF_FILES.USERS);

	delete users[username];

	confMgmt.save(users, confConsts.CONF_FILES.USERS)
		.then(_ => {
			res.send({});
			logger.log.debug(`Successfully removed a [${username}] user by [${loggedInUsername}] user`);
		})
		.catch(
			(err) => {
				logger.log.error('Failed to remove a [%s] user. Reason : [%s]', username, utils.formatErr(err));
				utils.sendError(res, err);
			}
		);

});

router.post('/list-users', function (req, res) {
	const loggedInUsername = utils.getLoggedInUsername(req);

	logger.log.debug(`Listing existing nexl users by [${loggedInUsername}] user`);

	// only admins can perform this action
	if (!security.isAdmin(loggedInUsername)) {
		logger.log.error('Cannot list internal nexl users, admin permissions required');
		utils.sendError(res, 'admin permissions required');
		return;
	}

	const users = confMgmt.getCached(confConsts.CONF_FILES.USERS);
	const usersPeeled = {};
	for (let key in users) {
		const user = users[key];
		usersPeeled[key] = {
			disabled: user.disabled || false
		};
	}

	res.send(usersPeeled);
	logger.log.debug(`Successfully listed existing nexl users by [${loggedInUsername}] user`);
});

router.post('/change-password', function (req, res) {
	const loggedInUsername = utils.getLoggedInUsername(req);

	logger.log.debug(`Changing password for [${loggedInUsername}] user by [${loggedInUsername}] user`);

	Promise.resolve().then(() => {
		if (loggedInUsername === securityConsts.GUEST_USER) {
			logger.log.error('You must be logged in to change your password');
			return Promise.reject('Not logged in');
		}

		return security.changePassword(loggedInUsername, req.body.currentPassword, req.body.newPassword).then(() => {
			logger.log.debug(`Successfully changing password for [${loggedInUsername}] user by [${loggedInUsername}] user`);
			res.send({});
		});
	}).catch(
		(err) => {
			logger.log.error('Failed to change password for [%s] user. Reason : [%s]', loggedInUsername, err);
			utils.sendError(res, err);
		}
	);
});

router.post('/generate-token', function (req, res) {
	const loggedInUsername = utils.getLoggedInUsername(req);
	const username = req.body.username;

	logger.log.debug(`Generating registration token for [${username}] user by [${loggedInUsername}] user`);

	// only admins can generate token
	if (!security.isAdmin(loggedInUsername)) {
		logger.log.error('Cannot generate new token. admin permissions required');
		utils.sendError(res, 'admin permissions required');
		return;
	}

	const users = confMgmt.getCached(confConsts.CONF_FILES.USERS);

	if (users[username] === undefined) {
		logger.log.error(`Failed to enable/disable a user [%s]. Reason : the [${username}] user doesnt exist`);
		utils.sendError(res, `User doesn't exist`);
		return;
	}

	users[username].token2ResetPassword = utils.generateNewToken();

	confMgmt.save(users, confConsts.CONF_FILES.USERS)
		.then(_ => {
			res.send(users[username].token2ResetPassword);
			logger.log.debug(`Successfully generated registration token for [${username}] user by [${loggedInUsername}] user`);
		})
		.catch(
			(err) => {
				users[username].token2ResetPassword = undefined;
				logger.log.error('Failed to enable/disable a user [%s]. Reason : [%s]', username, utils.formatErr(err));
				utils.sendError(res, err);
			}
		);

});

router.post('/resolve-status', function (req, res) {
	const username = utils.getLoggedInUsername(req);
	logger.log.debug(`Resolving status for [${username}] user by [${username}] user`);
	const status = security.status(username);
	status['isLoggedIn'] = username !== securityConsts.GUEST_USER;
	status['username'] = username;
	res.send(status);
});

router.post('/login', function (req, res) {
	const username = req.body.username;

	logger.log.debug(`Logging in with  [${username}] user`);

	security.isPasswordValid(username, req.body.password).then((isValid) => {
		if (!isValid) {
			logger.log.error('Bad credentials for login attempt');
			return Promise.reject('Bad credentials');
		}

		// encoding
		const token = utils.encrypt(username);

		// send it back to the client
		res.send(token);
		res.end();
		logger.log.debug(`Successfully logged in with  [${username}] user`);

	}).catch((err) => {
		logger.log.error('Failed to login with a [%s] user. Reason : [%s]', username, err);
		utils.sendError(res, err);
	});
});

router.post('/register', function (req, res) {
	const username = req.body.username;
	const password = req.body.password;
	const token = req.body.token;

	logger.log.debug(`Registering/resetting password for [${username}] user`);

	Promise.resolve().then(() => {
		// todo : proper password validation
		if (password.length < 1) {
			logger.log.error('Password cannot be empty');
			return Promise.reject('Password cannot be empty');
		}

		const userObj = confMgmt.getCached(confConsts.CONF_FILES.USERS)[username];
		if (userObj.disabled === true) {
			logger.log.error(`Failed to register a [${username}]. Reason : user is disabled !`);
			utils.sendError(res, 'User is disabled');
			return;
		}

		return security.resetPassword(username, password, token).then(() => {
			res.send({});
			logger.log.debug(`Successfully Registered/reset password for [${username}] user`);
		})
	}).catch((err) => {
		logger.log.error('Failed to register a [%s] user. Reason : [%s]', username, err);
		utils.sendError(res, err);
	});
});

router.post('/*', function (req, res) {
	logger.log.error(`Unknown route [${req.baseUrl}]`);
	utils.sendError(res, `Unknown route`, 404);
});

router.get('/*', function (req, res) {
	logger.log.error(`Unknown route [${req.baseUrl}]`);
	utils.sendError(res, `Unknown route`, 404);
});
// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
