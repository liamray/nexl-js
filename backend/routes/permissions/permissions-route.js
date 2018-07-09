const express = require('express');
const router = express.Router();

const utils = require('../../api/utils');
const security = require('../../api/security');
const confMgmt = require('../../api/conf-mgmt');
const confConsts = require('../../common/conf-constants');
const logger = require('../../api/logger');

router.post('/load', function (req, res) {
	const username = utils.getLoggedInUsername(req);

	logger.log.debug(`Loading all permissions by [${username}] user`);

	if (!security.isAdmin(username)) {
		logger.log.error('Cannot load permissions because the [%s] user doesn\'t have admin permissions', username);
		utils.sendError(res, 'admin permissions required');
		return;
	}

	res.send({
		admins: confMgmt.getCached(confConsts.CONF_FILES.ADMINS),
		assignPermissions: confMgmt.getCached(confConsts.CONF_FILES.PERMISSIONS)
	});

	logger.log.debug(`Successfully loaded all permissions by [${username}] user`);
});

router.post('/save', function (req, res, next) {
	const username = utils.getLoggedInUsername(req);

	logger.log.debug(`Saving all permissions by [${username}] user`);

	if (!security.isAdmin(username)) {
		logger.log.error('Cannot save permissions because the [%s] user doesn\'t have admin permissions', username);
		utils.sendError(res, 'admin permissions required');
		return;
	}

	const admins = req.body.admins;
	const assignPermissions = req.body.assignPermissions;

	return confMgmt.save(admins, confConsts.CONF_FILES.ADMINS).then(() => {
		return confMgmt.save(assignPermissions, confConsts.CONF_FILES.PERMISSIONS).then(() => {
			res.send({});
			logger.log.debug(`Successfully saved all permissions by [${username}] user`);
		});
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
