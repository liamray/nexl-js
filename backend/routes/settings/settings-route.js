const express = require('express');
const router = express.Router();

const utils = require('../../api/utils');
const security = require('../../api/security');
const jsFilesUtils = require('../../api/jsfiles-utils');
const confMgmt = require('../../api/conf-mgmt');
const confConsts = require('../../common/conf-constants');
const logger = require('../../api/logger');

const NEXL_HOME_DIR = 'nexl-home-dir';

router.post('/avail-values', function (req, res, next) {
	const data = {
		logLevels: logger.getAvailLevels(),
		encodings: confConsts.AVAILABLE_ENCODINGS
	};

	res.send(data);
});

router.post('/load', function (req, res) {
	const username = utils.getLoggedInUsername(req);

	logger.log.debug(`Loading nexl server settings by [${username}] user`);

	if (!security.isAdmin(username)) {
		logger.log.error('The [%s] user doesn\'t have admin permissions to load settings', username);
		utils.sendError(res, 'admin permissions required');
		return;
	}

	const settings = confMgmt.getCached(confConsts.CONF_FILES.SETTINGS);
	settings[NEXL_HOME_DIR] = confMgmt.getNexlHomeDir();
	res.send(settings);
	logger.log.debug(`Successfully loaded nexl server settings by [${username}] user`);
});

router.post('/save', function (req, res, next) {
	const username = utils.getLoggedInUsername(req);
	logger.log.debug(`Saving nexl server settings by [${username}] user`);

	if (!security.isAdmin(username)) {
		logger.log.error('The [%s] user doesn\'t have admin permissions to save settings', username);
		utils.sendError(res, 'admin permissions required');
		return;
	}

	const data = req.body;
	delete data[NEXL_HOME_DIR];
	logger.log.level = data[confConsts.SETTINGS.LOG_LEVEL];
	const jsRootDir = confMgmt.getCached(confConsts.CONF_FILES.SETTINGS)[confConsts.SETTINGS.JS_FILES_ROOT_DIR];

	return confMgmt.saveSettings(data).then(
		() => {
			res.send({});
			logger.log.debug(`Successfully saved nexl server settings by [${username}] user`);

			// is js root dir was changed ?
			if (jsRootDir !== data[confConsts.SETTINGS.JS_FILES_ROOT_DIR]) {
				// reloading cache
				jsFilesUtils.cacheJSFiles();
			}
		}).catch(
		(err) => {
			logger.log.error('Failed to save settings. Reason : [%s]', err);
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
