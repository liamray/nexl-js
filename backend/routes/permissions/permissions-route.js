const express = require('express');
const router = express.Router();

const utils = require('../../api/utils');
const security = require('../../api/security');
const confMgmt = require('../../api/conf-mgmt');
const confConsts = require('../../common/conf-constants');
const restUrls = require('../../common/rest-urls');
const logger = require('../../api/logger');

//////////////////////////////////////////////////////////////////////////////
// loads permissions
//////////////////////////////////////////////////////////////////////////////
router.post(restUrls.PERMISSIONS.URLS.LOAD_PERMISSIONS, function (req, res) {
	const username = security.getLoggedInUsername(req);

	logger.log.debug(`Loading all permissions by [${username}] user`);

	if (!security.isAdmin(username)) {
		logger.log.error('Cannot load permissions because the [%s] user doesn\'t have admin permissions', username);
		security.sendError(res, 'admin permissions required');
		return;
	}

	res.send({
		admins: confMgmt.getCached(confConsts.CONF_FILES.ADMINS),
		assignPermissions: confMgmt.getCached(confConsts.CONF_FILES.PERMISSIONS)
	});

	logger.log.debug(`Successfully loaded all permissions by [${username}] user`);
});

//////////////////////////////////////////////////////////////////////////////
// saves permissions
//////////////////////////////////////////////////////////////////////////////
router.post(restUrls.PERMISSIONS.URLS.SAVE_PERMISSIONS, function (req, res, next) {
	const username = security.getLoggedInUsername(req);

	logger.log.debug(`Saving all permissions by [${username}] user`);

	if (!security.isAdmin(username)) {
		logger.log.error('Cannot save permissions because the [%s] user doesn\'t have admin permissions', username);
		security.sendError(res, 'admin permissions required');
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
			security.sendError(res, err);
		});
});

//////////////////////////////////////////////////////////////////////////////
// undeclared routes
//////////////////////////////////////////////////////////////////////////////
router.post('/*', function (req, res) {
	logger.log.error(`Unknown route [${req.baseUrl}]`);
	security.sendError(res, `Unknown route`, 404);
});

router.get('/*', function (req, res) {
	logger.log.error(`Unknown route [${req.baseUrl}]`);
	security.sendError(res, `Unknown route`, 404);
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
