const express = require('express');
const router = express.Router();

const util = require('util');

const utils = require('../../api/utils');
const security = require('../../api/security');
const confMgmt = require('../../api/conf-mgmt');
const logger = require('../../api/logger');

router.post('/is-admin', function (req, res, next) {
	const username = utils.resolveUsername(req);
	logger.log.debug('Checking is a [%s] user has admin permissions', username);

	// only admins permitted for this action
	if (security.isAdmin(username)) {
		logger.log.debug('The [%s] user has admin permissions', username);
		res.send({});
	} else {
		const msg = util.format('The [%s] user doesn\'t have admin permissions', username);
		logger.log.debug(msg);
		utils.sendError(res, msg);
	}
});

router.post('/load', function (req, res, next) {
	const username = utils.resolveUsername(req);
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
	const username = utils.resolveUsername(req);
	logger.log.debug('Saving permissions for [%s] user', username);

	// only admins permitted for this action
	if (!security.isAdmin(username)) {
		logger.log.error('The [%s] user doesn\'t have admin permissions to save permissions', username);
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
