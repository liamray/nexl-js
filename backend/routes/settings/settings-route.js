const express = require('express');
const router = express.Router();

const utils = require('../../api/utils');
const security = require('../../api/security');
const cmdLineArgs = require('../../api/cmd-line-args');
const confMgmt = require('../../api/conf-mgmt');
const logger = require('../../api/logger');


router.post('/avail-values', function (req, res, next) {
	const data = {
		logLevels: logger.getAvailLevels(),
		encodings: confMgmt.AVAILABLE_ENCODINGS
	};

	res.send(data);
});

router.post('/load', function (req, res, next) {
	const username = utils.getLoggedInUsername(req);
	logger.log.debug('Loading settings for [%s] user', username);

	// only admins permitted for this action
	if (!security.isAdmin(username)) {
		logger.log.error('The [%s] user doesn\'t have admin permissions to load settings', username);
		utils.sendError(res, 'admin permissions required');
		return;
	}

	// loading all settings
	confMgmt.loadAsync(confMgmt.CONF_FILES.SETTINGS).then((settings) => {
		settings['nexl-home-dir'] = cmdLineArgs.NEXL_HOME_DIR;
		res.send(settings);
	}).catch((err) => {
		logger.log.error('Failed to load settings. Reason : [%s]', err);
		utils.sendError(res, err);
	});
});

router.post('/save', function (req, res, next) {
	const username = utils.getLoggedInUsername(req);
	logger.log.debug('Saving settings for [%s] user', username);

	// only admins permitted for this action
	if (!security.isAdmin(username)) {
		logger.log.error('The [%s] user doesn\'t have admin permissions to save settings', username);
		utils.sendError(res, 'admin permissions required');
		return;
	}

	const data = req.body;

	logger.log.level = data['log-level'];
	try {
		confMgmt.save(data, confMgmt.CONF_FILES.SETTINGS);
	} catch (e) {
		logger.log.error('Failed to update data. Reason : [%s]', e);
		utils.sendError(res, 'Failed to update settings');
		return;
	}

	res.send({});
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
