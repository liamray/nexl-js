const express = require('express');

const security = require('../../api/security');
const utils = require('../../api/utils');
const logger = require('../../api/logger');

const router = express.Router();

router.post('/change-password', function (req, res) {
	const loggedInUsername = utils.getLoggedInUsername(req);
	logger.log.debug('Changing password for [%s] user', loggedInUsername);

	Promise.resolve().then(() => {
		if (loggedInUsername === utils.GUEST_USER) {
			logger.log.error('You must be logged in to change your password');
			return Promise.reject('Not logged in');
		}

		return security.changePassword(loggedInUsername, req.body.currentPassword, req.body.newPassword).then(() => {
			logger.log.debug('Password has been changed for [%s] user', loggedInUsername);
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
	logger.log.debug('Generating token for [%s] user', loggedInUsername);

	security.isAdmin(loggedInUsername).then((isAdmin) => {
		if (!isAdmin) {
			logger.log.error('Cannot generate new token. admin permissions required');
			return Promise.reject('admin permissions required');
		}

		const username = req.body.username;
		if (username.length < 1) {
			logger.log.error('Cannot generate new token. Username cannot be empty');
			return Promise.reject('Username cannot be empty');
		}

		return security.generateTokenAndSave(username).then((token) => {
			res.send({
				token: token
			});
		});

	}).catch((err) => {
		logger.log.error('Failed to generate a new token. Reason : [%s]', err);
		utils.sendError(res, err);
	});

});

router.post('/resolve-status', function (req, res) {
	const username = utils.getLoggedInUsername(req);
	security.status(username).then((status) => {
		status['isLoggedIn'] = username !== utils.GUEST_USER;
		status['username'] = username;
		res.send(status);
	}).catch((err) => {
		logger.log.error('Failed to resolve a status for [%s] user. Reason : [%s]', username, err);
		utils.sendError(res, err);
	});
});

router.post('/login', function (req, res) {
	const username = req.body.username;

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

	}).catch((err) => {
		logger.log.error('Failed to login with a [%s] user. Reason : [%s]', username, err);
		utils.sendError(res, err);
	});
});

router.post('/register', function (req, res) {
	const username = req.body.username;
	const password = req.body.password;
	const token = req.body.token;

	Promise.resolve().then(() => {
		if (password.length < 1) {
			logger.log.error('Password cannot be empty');
			return Promise.reject('Password cannot be empty');
		}

		return security.resetPassword(username, password, token).then(() => {
			logger.log.debug('Password was reset for [%s] user', username);
			res.send({});
		})
	}).catch((err) => {
		logger.log.error('Failed to register a [%s] user. Reason : [%s]', err);
		utils.sendError(res, err);
	});
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
