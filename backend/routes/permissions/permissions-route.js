const express = require('express');
const router = express.Router();

const util = require('util');
const j79 = require('j79-utils');

const utils = require('../../api/utils');
const security = require('../../api/security');
const confMgmt = require('../../api/conf-mgmt');
const logger = require('../../api/logger');

router.post('/load', function (req, res, next) {
	const username = utils.getLoggedInUsername(req);
	logger.log.debug('Loading permissions for [%s] user', username);

	// only admins permitted for this action
	if (!security.isAdmin(username)) {
		logger.log.error('The [%s] user doesn\'t have admin permissions to read permissions', username);
		utils.sendError(res, 'admin permissions required');
		return;
	}

	res.send({
		admins: confMgmt.load(confMgmt.CONF_FILES.ADMINS),
		assignPermissions: confMgmt.load(confMgmt.CONF_FILES.PERMISSIONS)
	});
});

router.post('/save', function (req, res, next) {
	const username = utils.getLoggedInUsername(req);
	logger.log.debug('Saving permissions for [%s] user', username);

	// only admins permitted for this action
	if (!security.isAdmin(username)) {
		logger.log.error('The [%s] user doesn\'t have admin permissions to save permissions', username);
		utils.sendError(res, 'admin permissions required');
		return;
	}

	const admins = req.body.admins;
	const assignPermissions = req.body.assignPermissions;

	confMgmt.save(admins, confMgmt.CONF_FILES.ADMINS);
	confMgmt.save(assignPermissions, confMgmt.CONF_FILES.PERMISSIONS);

	res.send({});
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
