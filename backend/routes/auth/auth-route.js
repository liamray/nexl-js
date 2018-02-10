const express = require('express');

const security = require('../../api/security');
const utils = require('../../api/utils');

const router = express.Router();

router.post('/login', function (req, res) {
	const username = req.body.username;

	// if not authenticated, clear token and send error
	if (!security.isPasswordValid(username, req.body.password)) {
		req.session.credentials = undefined;
		utils.sendError(res, 'Bad credentials');
		return;
	}

	// authenticated. generate a token
	const credentials = {
		username: username,
		token: utils.generateRandomBytes(16)
	};

	// store credentials in the session
	req.session.credentials = credentials;

	// send it back to the client
	res.send(credentials);

	res.end();
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
