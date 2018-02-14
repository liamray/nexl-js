const express = require('express');
const router = express.Router();

const utils = require('../../api/utils');
const security = require('../../api/security');
const confMgmt = require('../../api/conf-mgmt');

router.post('/get-admins', function (req, res, next) {
	const username = utils.resolveUsername(req);

	// only admins permitted for this action
	if (!security.isAdmin(username)) {
		utils.sendError(res, 'admin permissions required');
		return;
	}

	const admins = confMgmt.load(confMgmt.CONF_FILES.ADMINS);
	res.send(admins);
});


router.post('/get-permissions', function (req, res, next) {
	const username = utils.resolveUsername(req);

	// only admins permitted for this action
	if (!security.isAdmin(username)) {
		utils.sendError(res, 'admin permissions required');
		return;
	}

	const groups = confMgmt.load(confMgmt.CONF_FILES.PERMISSIONS);
	res.send(groups);
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
