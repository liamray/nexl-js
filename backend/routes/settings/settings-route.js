const express = require('express');
const router = express.Router();

const utils = require('../../api/utils');
const security = require('../../api/security');
const cmdLineArgs = require('../../api/cmd-line-args');
const settings = require('../../api/settings');
const confMgmt = require('../../api/conf-mgmt');
const logger = require('../../api/logger');

const SETTINGS_2_LOAD = [settings.NEXL_SOURCES_DIR, settings.NEXL_SOURCES_ENCODING, settings.HTTP_TIMEOUT, settings.LDAP_URL, settings.HTTP_BINDING, settings.HTTP_PORT, settings.HTTPS_BINDING, settings.HTTPS_PORT, settings.SSL_CERT_LOCATION, settings.SSL_KEY_LOCATION, settings.LOG_FILE_LOCATION, settings.LOG_LEVEL, settings.LOG_ROTATE_FILE_SIZE, settings.LOG_ROTATE_FILES_COUNT, settings.NEXL_CALLBACKS];

function filterSettings(settings) {
	const result = {};
	for (let key in settings) {
		if (SETTINGS_2_LOAD.indexOf(key) >= 0) {
			result[key] = settings[key];
		}
	}

	return result;
}

router.post('/load', function (req, res, next) {
	const username = utils.resolveUsername(req);
	logger.log.debug('Loading settings for [%s] user', username);

	// only admins permitted for this action
	if (!security.isAdmin(username)) {
		logger.log.error('The [%s] user doesn\'t have admin permissions to load settings', username);
		utils.sendError(res, 'admin permissions required');
		return;
	}

	// load setting one by one according to SETTINGS_2_LOAD
	// optimize settings.get() method -> allow to pass a whole object
	let allSettings = confMgmt.load(confMgmt.CONF_FILES.SETTINGS);
	let filteredSettings = filterSettings(allSettings);
	filteredSettings['nexl-home-dir'] = cmdLineArgs.NEXL_HOME_DIR;
	res.send(filteredSettings);
});

router.post('/save', function (req, res, next) {
	const username = utils.resolveUsername(req);
	logger.log.debug('Saving settings for [%s] user', username);

	// only admins permitted for this action
	if (!security.isAdmin(username)) {
		logger.log.error('The [%s] user doesn\'t have admin permissions to save settings', username);
		utils.sendError(res, 'admin permissions required');
		return;
	}

	// load all settings, iterate over new items and compare with loaded ( of course filter items by SETTINGS_2_LOAD )

	confMgmt.save(req.body.admins, confMgmt.CONF_FILES.ADMINS);
	confMgmt.save(req.body.assignPermissions, confMgmt.CONF_FILES.PERMISSIONS);

	res.send({});
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
