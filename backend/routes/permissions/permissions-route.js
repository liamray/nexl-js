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

	if (!security.isAdmin(username)) {
		logger.log.error('Cannot load permissions because the [%s] user doesn\'t have admin permissions', username);
		utils.sendError(res, 'admin permissions required');
		return;
	}

	res.send({
		admins: confMgmt.getCached(confMgmt.CONF_FILES.ADMINS),
		assignPermissions: confMgmt.getCached(confMgmt.CONF_FILES.PERMISSIONS)
	});

});

router.post('/save', function (req, res, next) {
	const username = utils.getLoggedInUsername(req);
	logger.log.debug('Saving permissions for [%s] user', username);

	if (!security.isAdmin(username)) {
		logger.log.error('Cannot save permissions because the [%s] user doesn\'t have admin permissions', username);
		utils.sendError(res, 'admin permissions required');
		return;
	}

	const admins = req.body.admins;
	const assignPermissions = req.body.assignPermissions;

	return confMgmt.save(admins, confMgmt.CONF_FILES.ADMINS).then(() => {
		return confMgmt.save(assignPermissions, confMgmt.CONF_FILES.PERMISSIONS).then(() => res.send({}));
	}).catch(
		(err) => {
			logger.log.error('Failed to save permissions for [%s] user. Reason : [%s]', username, err);
			utils.sendError(res, err);
		});
});

router.post('/*', function (req, res) {
	logger.log.error(`Unknown route [${req.baseUrl}]`);
	utils.sendError(res, `Unknown route`, 404);
});

router.get('/*', function (req, res) {
	logger.log.error(`Unknown route [${req.baseUrl}]`);
	utils.sendError(res, `Unknown route`, 404);
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
