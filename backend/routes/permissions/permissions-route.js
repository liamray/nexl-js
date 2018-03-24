const express = require('express');
const router = express.Router();

const util = require('util');
const j79 = require('j79-utils');
const schemaValidation = require('../../api/schema-validation');

const utils = require('../../api/utils');
const security = require('../../api/security');
const confMgmt = require('../../api/conf-mgmt');
const logger = require('../../api/logger');

// data validation schemas
const ADMINS_SCHEMA = [j79.isString];
const ASSIGN_PERMISSIONS_SCHEMA = {
	'*': {
		read: j79.isBool,
		write: j79.isBool
	}
};

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

	// validating admins
	if (!schemaValidation(admins, ADMINS_SCHEMA)) {
		logger.log.error('Detected wrong data sent to server for [admins] record');
		utils.sendError(res, 'Wrong data for [admins] record');
		return;
	}

	// validating assign permissions
	if (!schemaValidation(assignPermissions, ASSIGN_PERMISSIONS_SCHEMA)) {
		logger.log.error('Detected wrong data sent to server for [assignPermissions] record');
		utils.sendError(res, 'Wrong data for [assignPermissions] record');
		return;
	}

	confMgmt.save(admins, confMgmt.CONF_FILES.ADMINS);
	confMgmt.save(assignPermissions, confMgmt.CONF_FILES.PERMISSIONS);

	res.send({});
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
