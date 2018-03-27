const express = require('express');

const security = require('../../api/security');
const utils = require('../../api/utils');
const logger = require('../../api/logger');

const router = express.Router();

router.post('/generate-token', function (req, res) {
	const loggedInUsername = utils.getLoggedInUsername(req);
	logger.log.debug('Generating token for [%s] user', loggedInUsername);

	// only admins permitted for this action
	if (!security.isAdmin(loggedInUsername)) {
		logger.log.error('The [%s] user doesn\'t have admin permissions to generate token', loggedInUsername);
		utils.sendError(res, 'admin permissions required');
		return;
	}

	const username = req.body.username;
	if (username.length < 1) {
		logger.log.error('Username cannot be empty');
		utils.sendError(res, 'Username cannot be empty');
		return;
	}

	res.send({
		token: security.generateTokenAndSave(username)
	});
});

router.post('/resolve-status', function (req, res) {
	const username = utils.getLoggedInUsername(req);
	const status = {
		isLoggedIn: username !== utils.UNAUTHORIZED_USERNAME,
		isAdmin: security.isAdmin(username),
		hasReadPermission: security.hasReadPermission(username),
		hasWritePermission: security.hasWritePermission(username),
	};
	status['username'] = username;
	res.send(status);
});

router.post('/login', function (req, res) {
	const username = req.body.username;

	// if not authenticated, clear token and send error
	if (!security.isPasswordValid(username, req.body.password)) {
		logger.log.error('Login failed. Reason : bad credentials');
		utils.sendError(res, 'Bad credentials');
		return;
	}

	// encoding
	const token = utils.encrypt(username);

	// send it back to the client
	res.send(token);

	res.end();
});

router.post('/register', function (req, res) {
	const username = req.body.username;
	const password = req.body.password;
	const token = req.body.token;

	if (password.length < 1) {
		logger.log.error('Password cannot be empty');
		utils.sendError(res, 'Password cannot be empty');
		return;
	}

	try {
		security.setPassword(username, password, token);
	} catch (e) {
		logger.log.error(e.toString());
		utils.sendError(res, e.toString());
		return;
	}

	res.send({});
	res.end();
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
