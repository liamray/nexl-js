const express = require('express');
const router = express.Router();

const utils = require('../../api/utils');
const security = require('../../api/security');
const confMgmt = require('../../api/conf-mgmt');

router.post('/load', function (req, res, next) {
	const username = utils.resolveUsername(req);

	// only admins permitted for this action
	if (!security.isAdmin(username)) {
		utils.sendError(res, 'admin permissions required');
		return;
	}

	res.send({
		admins: confMgmt.load(confMgmt.CONF_FILES.ADMINS),
		assignPermissions: confMgmt.load(confMgmt.CONF_FILES.PERMISSIONS)
	});
});

router.post('/save', function (req, res, next) {
	const username = utils.resolveUsername(req);

	// only admins permitted for this action
	if (!security.isAdmin(username)) {
		utils.sendError(res, 'admin permissions required');
		return;
	}

	confMgmt.save(req.body.admins, confMgmt.CONF_FILES.ADMINS);
	confMgmt.save(req.body.assignPermissions, confMgmt.CONF_FILES.PERMISSIONS);

	res.send({});
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
