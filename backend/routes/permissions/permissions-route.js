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

	security.isAdmin(username).then((isAdmin) => {
		if (!isAdmin) {
			logger.log.error('Cannot load permissions because the [%s] user doesn\'t have admin permissions', username);
			return Promise.reject('admin permissions required');
		}

		return confMgmt.loadAsync(confMgmt.CONF_FILES.ADMINS).then((admins) => {
			return confMgmt.loadAsync(confMgmt.CONF_FILES.PERMISSIONS).then((permissions) => {
				res.send({
					admins: admins,
					assignPermissions: permissions
				});
			});
		});
	}).catch((err) => {
		logger.log.error('Failed to load permissions for [%s] user. Reason : [%s]', username, err);
		utils.sendError(res, err);
	});
});

router.post('/save', function (req, res, next) {
	const username = utils.getLoggedInUsername(req);
	logger.log.debug('Saving permissions for [%s] user', username);

	security.isAdmin(username).then((isAdmin) => {
		if (!isAdmin) {
			logger.log.error('Cannot save permissions because the [%s] user doesn\'t have admin permissions', username);
			return Promise.reject('admin permissions required');
		}

		const admins = req.body.admins;
		const assignPermissions = req.body.assignPermissions;
		confMgmt.save(admins, confMgmt.CONF_FILES.ADMINS);
		confMgmt.save(assignPermissions, confMgmt.CONF_FILES.PERMISSIONS);

		res.send({});
	}).catch((err) => {
		logger.log.error('Failed to save permissions for [%s] user. Reason : [%s]', username, err);
		utils.sendError(res, err);
	});
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
