const express = require('express');

const utils = require('../../api/utils');
const security = require('../../api/security');

const router = express.Router();

router.post('/get-admins', function (req, res, next) {
	var username = utils.resolveUsername(req);

	/*
		if (!security.hasReadPermission(username)) {
			utils.sendError(res, 'You don\'t have a read permission');
			return;
		}
	*/

});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
