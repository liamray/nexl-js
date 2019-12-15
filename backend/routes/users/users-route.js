const express = require('express');

const security = require('../../api/security');
const utils = require('../../api/utils');
const logger = require('../../api/logger');
const confMgmt = require('../../api/conf-mgmt');
const confConsts = require('../../common/conf-constants');
const restUrls = require('../../common/rest-urls');
const securityConsts = require('../../common/security-constants');
const commonUtils = require('../../common/common-utils');
const uiConsts = require('../../common/ui-constants');

const router = express.Router();

//////////////////////////////////////////////////////////////////////////////
// enable/disable user
//////////////////////////////////////////////////////////////////////////////
router.post(restUrls.USERS.URLS.ENABLE_DISABLE_USER, function (req, res) {
	const loggedInUsername = security.getLoggedInUsername(req);
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
		security.sendError(res, 'admin permissions required');
		return;
	}

	const users = confMgmt.getCached(confConsts.CONF_FILES.USERS);

	if (users[username] === undefined) {
		logger.log.error(`Failed to enable/disable a user [%s]. Reason : the [${username}] user doesnt exist`);
		security.sendError(res, `User doesn't exist`);
		return;
	}

	users[username].disabled = isDisabled;

	confMgmt.save(users, confConsts.CONF_FILES.USERS)
		.then(_ => {
			res.send({});
			logger.log.log('verbose', `Enabled/disabled a [${username}] user by [${loggedInUsername}] user`);
		})
		.catch(
			(err) => {
				logger.log.error('Failed to enable/disable a user [%s]. Reason : [%s]', username, utils.formatErr(err));
				security.sendError(res, 'Failed to enable/disable user');
			}
		);

});

//////////////////////////////////////////////////////////////////////////////
// rename user
//////////////////////////////////////////////////////////////////////////////
router.post(restUrls.USERS.URLS.RENAME_USER, function (req, res) {
	const loggedInUsername = security.getLoggedInUsername(req);
	const newUsername = req.body.newUsername;
	const oldUsername = req.body.oldUsername;

	logger.log.debug(`Renaming a [${oldUsername}] user to [${newUsername}] by [${loggedInUsername}]`);

	// only admins can perform this action
	if (!security.isAdmin(loggedInUsername)) {
		logger.log.error('Cannot rename user, admin permissions required');
		security.sendError(res, 'admin permissions required');
		return;
	}

	if (!commonUtils.validateUsernameStrength(newUsername)) {
		logger.log.error(`Bad new username [${newUsername}]`);
		security.sendError(res, uiConsts.BAD_USERNAME_MSG);
		return;
	}

	const users = confMgmt.getCached(confConsts.CONF_FILES.USERS);

	delete users[oldUsername];
	users[newUsername] = {};

	confMgmt.save(users, confConsts.CONF_FILES.USERS)
		.then(_ => {
			res.send({});
			logger.log.log('verbose', `Renamed a [${oldUsername}] user to [${newUsername}] by [${loggedInUsername}]`);
		})
		.catch(
			(err) => {
				logger.log.error('Failed to create a new user [%s]. Reason : [%s]', newUsername, utils.formatErr(err));
				security.sendError(res, 'Failed to create a new user');
			}
		);

});

//////////////////////////////////////////////////////////////////////////////
// remove user
//////////////////////////////////////////////////////////////////////////////
router.post(restUrls.USERS.URLS.REMOVE_USER, function (req, res) {
	const loggedInUsername = security.getLoggedInUsername(req);
	const username = req.body.username;

	logger.log.debug(`Removing a [${username}] user by [${loggedInUsername}] user`);

	// only admins can perform this action
	if (!security.isAdmin(loggedInUsername)) {
		logger.log.error('Cannot create new user, admin permissions required');
		security.sendError(res, 'admin permissions required');
		return;
	}

	const users = confMgmt.getCached(confConsts.CONF_FILES.USERS);

	delete users[username];

	confMgmt.save(users, confConsts.CONF_FILES.USERS)
		.then(_ => {
			res.send({});
			logger.log.log('verbose', `Removed a [${username}] user by [${loggedInUsername}] user`);
		})
		.catch(
			(err) => {
				logger.log.error('Failed to remove a [%s] user. Reason : [%s]', username, utils.formatErr(err));
				security.sendError(res, 'Failed to remove a user');
			}
		);

});

//////////////////////////////////////////////////////////////////////////////
// list users
//////////////////////////////////////////////////////////////////////////////
router.post(restUrls.USERS.URLS.LIST_USERS, function (req, res) {
	const loggedInUsername = security.getLoggedInUsername(req);

	logger.log.debug(`Listing existing nexl users by [${loggedInUsername}] user`);

	// only admins can perform this action
	if (!security.isAdmin(loggedInUsername)) {
		logger.log.error('Cannot list internal nexl users, admin permissions required');
		security.sendError(res, 'admin permissions required');
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
	logger.log.debug(`Listed existing nexl users by [${loggedInUsername}] user`);
});

//////////////////////////////////////////////////////////////////////////////
// change password
//////////////////////////////////////////////////////////////////////////////
router.post(restUrls.USERS.URLS.CHANGE_PASSWORD, function (req, res) {
	const loggedInUsername = security.getLoggedInUsername(req);

	logger.log.debug(`Changing password for [${loggedInUsername}] user by [${loggedInUsername}] user`);

	Promise.resolve().then(() => {
		if (loggedInUsername === securityConsts.GUEST_USER) {
			logger.log.error('You must be logged in to change your password');
			return Promise.reject('Not logged in');
		}

		if (!commonUtils.validatePasswordStrength(req.body.newPassword)) {
			logger.log.error(`Password is not strong enough for [${loggedInUsername}] user`);
			return Promise.reject(uiConsts.BAD_PASSWORD_MSG);
		}

		return security.changePassword(loggedInUsername, req.body.currentPassword, req.body.newPassword).then(() => {
			logger.log.log('verbose', `Password changed for [${loggedInUsername}] user by [${loggedInUsername}] user`);
			res.send({});
		});
	}).catch(
		(err) => {
			logger.log.error('Failed to change password for [%s] user. Reason : [%s]', loggedInUsername, utils.formatErr(err));
			security.sendError(res, 'Failed to change password');
		}
	);
});

//////////////////////////////////////////////////////////////////////////////
// generate registration token
//////////////////////////////////////////////////////////////////////////////
router.post(restUrls.USERS.URLS.GENERATE_REGISTRATION_TOKEN, function (req, res) {
	const loggedInUsername = security.getLoggedInUsername(req);
	const username = req.body.username;

	logger.log.debug(`Generating registration token for [${username}] user by [${loggedInUsername}] user`);

	// only admins can generate token
	if (!security.isAdmin(loggedInUsername)) {
		logger.log.error('Cannot generate new token. admin permissions required');
		security.sendError(res, 'admin permissions required');
		return;
	}

	const users = confMgmt.getCached(confConsts.CONF_FILES.USERS);

	if (users[username] === undefined) {
		logger.log.error(`Failed to generate token. Reason : the [${username}] user doesn't exist`);
		security.sendError(res, `User doesn't exist`);
		return;
	}

	users[username].token2ResetPassword = utils.generateNewToken();

	confMgmt.save(users, confConsts.CONF_FILES.USERS)
		.then(_ => {
			res.send({
				token: users[username].token2ResetPassword.token,
				tokenValidHours: security.TOKEN_VALID_HOURS
			});
			logger.log.log('verbose', `Generated registration token for [${username}] user by [${loggedInUsername}] user`);
		})
		.catch(
			(err) => {
				users[username].token2ResetPassword = undefined;
				logger.log.error('Failed generate token for the [%s] user. Reason : [%s]', username, utils.formatErr(err));
				security.sendError(res, 'Failed to generate token');
			}
		);

});

//////////////////////////////////////////////////////////////////////////////
// resolve user status ( is logged in and what permission he has )
//////////////////////////////////////////////////////////////////////////////
router.post(restUrls.USERS.URLS.RESOLVE_USER_STATUS, function (req, res) {
	const username = security.getLoggedInUsername(req);
	logger.log.debug(`Resolving status for [${username}] user by [${username}] user`);
	const status = security.status(username);
	status['isLoggedIn'] = username !== securityConsts.GUEST_USER;
	status['username'] = username;
	res.send(status);
});

//////////////////////////////////////////////////////////////////////////////
// log in
//////////////////////////////////////////////////////////////////////////////
router.post(restUrls.USERS.URLS.LOGIN, function (req, res) {
	const username = req.body.username;

	logger.log.debug(`Logging in with  [${username}] user`);

	security.isPasswordValid(username, req.body.password).then((isValid) => {
		if (!isValid) {
			logger.log.error(`Bad credentials for the [${username}] user`);
			return Promise.reject('Bad credentials');
		}

		security.login(username, res);

		res.send({});
		logger.log.log('verbose', `Logged in as [${username}] user`);

	}).catch((err) => {
		logger.log.error('Failed to login with a [%s] user. Reason : [%s]', username, utils.formatErr(err));
		security.sendError(res, 'Failed to log in');
	});
});

//////////////////////////////////////////////////////////////////////////////
// log out
//////////////////////////////////////////////////////////////////////////////
router.post(restUrls.USERS.URLS.LOGOUT, function (req, res) {
	security.logout(req, res);
	res.send({});
});

//////////////////////////////////////////////////////////////////////////////
// register
//////////////////////////////////////////////////////////////////////////////
router.post(restUrls.USERS.URLS.REGISTER, function (req, res) {
	const username = req.body.username;
	const password = req.body.password;
	const token = req.body.token;

	logger.log.debug(`Registering/resetting password for [${username}] user`);

	Promise.resolve().then(() => {
		if (!commonUtils.validatePasswordStrength(password)) {
			logger.log.error(`Password is not strong enough for [${username}] user`);
			return Promise.reject(uiConsts.BAD_PASSWORD_MSG);
		}

		const userObj = confMgmt.getCached(confConsts.CONF_FILES.USERS)[username];

		if (userObj === undefined) {
			logger.log.error(`Cannot register a [${username}] because it doesn't have registration token`);
			security.sendError(res, 'Bad token');
			return;
		}

		if (userObj.disabled === true) {
			logger.log.error(`Failed to register a [${username}]. Reason : user is disabled !`);
			security.sendError(res, 'User is disabled');
			return;
		}

		return security.resetPassword(username, password, token).then(() => {
			res.send({});
			logger.log.log('verbose', `Registered/reset password for [${username}] user`);
		})
	}).catch((err) => {
		logger.log.error('Failed to register a [%s] user. Reason : [%s]', username, utils.formatErr(err));
		security.sendError(res, 'Failed to register a user or token expired');
	});
});

//////////////////////////////////////////////////////////////////////////////
// undeclared router
//////////////////////////////////////////////////////////////////////////////
router.post('/*', function (req, res) {
	logger.log.error(`Unknown route [${req.baseUrl}]`);
	security.sendError(res, `Unknown route`, 404);
});

router.get('/*', function (req, res) {
	logger.log.error(`Unknown route [${req.baseUrl}]`);
	security.sendError(res, `Unknown route`, 404);
});
// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
