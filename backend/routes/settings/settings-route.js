const express = require('express');
const router = express.Router();

const util = require('util');
const j79 = require('j79-utils');

const utils = require('../../api/utils');
const security = require('../../api/security');
const cmdLineArgs = require('../../api/cmd-line-args');
const settings = require('../../api/settings');
const confMgmt = require('../../api/conf-mgmt');
const logger = require('../../api/logger');


const SETTINGS_2_LOAD = [settings.NEXL_SOURCES_DIR, settings.NEXL_SOURCES_ENCODING, settings.HTTP_TIMEOUT, settings.LDAP_URL, settings.HTTP_BINDING, settings.HTTP_PORT, settings.HTTPS_BINDING, settings.HTTPS_PORT, settings.SSL_CERT_LOCATION, settings.SSL_KEY_LOCATION, settings.LOG_FILE_LOCATION, settings.LOG_LEVEL, settings.LOG_ROTATE_FILE_SIZE, settings.LOG_ROTATE_FILES_COUNT, settings.NEXL_CALLBACKS];

router.post('/avail-values', function (req, res, next) {
	const data = {
		logLevels: logger.getAvailLevels(),
		encodings: settings.AVAILABLE_ENCODINGS
	};

	res.send(data);
});

router.post('/load', function (req, res, next) {
	const username = utils.resolveUsername(req);
	logger.log.debug('Loading settings for [%s] user', username);

	// only admins permitted for this action
	if (!security.isAdmin(username)) {
		logger.log.error('The [%s] user doesn\'t have admin permissions to load settings', username);
		utils.sendError(res, 'admin permissions required');
		return;
	}

	// loading all settings
	let allSettings = confMgmt.load(confMgmt.CONF_FILES.SETTINGS);
	const data = {};

	// building a data object where it's key set is a SETTINGS_2_LOAD and values are stored in allSettings
	for (let index in SETTINGS_2_LOAD) {
		const key = SETTINGS_2_LOAD[index];

		let val = allSettings[key];
		if (val === undefined) {
			val = settings.resolveDefaultValue(key);
		}

		data[key] = val;
	}

	// adding nexl home dir which is not apart of settings, but requires to display
	data['nexl-home-dir'] = cmdLineArgs.NEXL_HOME_DIR;

	res.send(data);
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

	// filtering and validating settings
	const data = {};
	for (let index in SETTINGS_2_LOAD) {
		const key = SETTINGS_2_LOAD[index];

		let val = req.body[key];
		if (val === undefined) {
			val = settings.resolveDefaultValue(key);
		}

		// validating
		if (!settings.isValid(key, val)) {
			utils.sendError(res, util.format('Unacceptable value for [%s] key', key));
			return;
		}

		data[key] = val;
	}

	// special SSL settings validation
	const sslSettings = [data[settings.HTTPS_BINDING], data[settings.HTTPS_PORT], data[settings.SSL_CERT_LOCATION], data[settings.SSL_KEY_LOCATION]];
	let valuesCnt = 0;
	for (let index in sslSettings) {
		const val = sslSettings[index];
		if (j79.isString(val) && val !== '') {
			valuesCnt++;
		}
	}

	if (valuesCnt !== 0 && valuesCnt !== 4) {
		utils.sendError(res, util.format('Please provide all 4 following parameters to setup HTTPS connection : https binding, https port, ssl cert location, ssl key location. Got only [%s] of them', valuesCnt));
		return;
	}

	confMgmt.save(data, confMgmt.CONF_FILES.SETTINGS);

	res.send({});
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
