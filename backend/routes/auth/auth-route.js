const express = require('express');

const security = require('../../api/security');
const utils = require('../../api/utils');

const router = express.Router();

router.post('/is-logged-in', function (req, res) {
	const username = utils.getLoggedInUsername(req);
	if (username === utils.UNAUTHORIZED_USERNAME) {
		utils.sendError(res, 'Not logged in');
	} else {
		res.send(username);
	}
});

router.post('/login', function (req, res) {
	const username = req.body.username;

	// if not authenticated, clear token and send error
	if (!security.isPasswordValid(username, req.body.password)) {
		utils.sendError(res, 'Bad credentials');
		return;
	}

	// encoding
	const token = utils.encrypt(username);

	// send it back to the client
	res.send(token);

	res.end();
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
