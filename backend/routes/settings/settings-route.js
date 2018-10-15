const express = require('express');
const router = express.Router();
const clone = require('clone');
const fse = require('fs-extra');

const nexlApp = require('../../nexl-app/nexl-app');
const security = require('../../api/security');
const storageUtils = require('../../api/storage-utils');
const confMgmt = require('../../api/conf-mgmt');
const confConsts = require('../../common/conf-constants');
const restUrls = require('../../common/rest-urls');
const logger = require('../../api/logger');

//////////////////////////////////////////////////////////////////////////////
// loads settings
//////////////////////////////////////////////////////////////////////////////
router.post(restUrls.SETTINGS.URLS.LOAD_SETTINGS, function (req, res) {
	const username = security.getLoggedInUsername(req);

	logger.log.debug(`Loading nexl server settings by [${username}] user`);

	if (!security.isAdmin(username)) {
		logger.log.error('The [%s] user doesn\'t have admin permissions to load settings', username);
		security.sendError(res, 'admin permissions required');
		return;
	}

	const settings = clone(confMgmt.getCached(confConsts.CONF_FILES.SETTINGS));

	// adding nexl home dir ( to display only )
	settings[confConsts.NEXL_HOME_DEF] = confMgmt.getNexlHomeDir();

	// replacing ldap password before send
	settings[confConsts.SETTINGS.LDAP_BIND_PASSWORD] = confConsts.PASSWORD_STUB;

	// sending data
	res.send(settings);
	logger.log.debug(`Successfully loaded nexl server settings by [${username}] user`);
});

function applyChanges(before) {
	let promise = Promise.resolve();

	const after = confMgmt.getNexlSettingsCached();

	// is log level changed ?
	if (before[confConsts.SETTINGS.LOG_LEVEL] !== after[confConsts.SETTINGS.LOG_LEVEL]) {
		logger.log.level = after[confConsts.SETTINGS.LOG_LEVEL];
	}

	// is http timeout changed ?
	if (before[confConsts.SETTINGS.HTTP_TIMEOUT] !== after[confConsts.SETTINGS.HTTP_TIMEOUT]) {
		nexlApp.setHttpTimeout(after[confConsts.SETTINGS.HTTP_TIMEOUT]);
	}

	// is nexl storage dir changed ?
	if (before[confConsts.SETTINGS.STORAGE_DIR] !== after[confConsts.SETTINGS.STORAGE_DIR]) {
		logger.log.info(`nexl storage dir was changed from [${before[confConsts.SETTINGS.STORAGE_DIR]}] to [${after[confConsts.SETTINGS.STORAGE_DIR]}]`);
		promise = promise.then(_ => fse.mkdirs(after[confConsts.SETTINGS.STORAGE_DIR])).then(storageUtils.cacheStorageFiles);
	}

	// is logs dir changed ?
	if (before[confConsts.SETTINGS.LOG_FILE_LOCATION] !== after[confConsts.SETTINGS.LOG_FILE_LOCATION]) {
		promise = promise.then(logger.configureLoggers)
			.then(_ => {
				logger.log.info(`Logs file location was changed from [${before[confConsts.SETTINGS.LOG_FILE_LOCATION]}] to [${after[confConsts.SETTINGS.LOG_FILE_LOCATION]}]`);
				return Promise.resolve();
			});
	}

	return promise;
}

//////////////////////////////////////////////////////////////////////////////
// saves settings
//////////////////////////////////////////////////////////////////////////////
router.post(restUrls.SETTINGS.URLS.SAVE_SETTINGS, function (req, res, next) {
	const username = security.getLoggedInUsername(req);
	logger.log.debug(`Saving nexl server settings by [${username}] user`);

	if (!security.isAdmin(username)) {
		logger.log.error('The [%s] user doesn\'t have admin permissions to save settings', username);
		security.sendError(res, 'admin permissions required');
		return;
	}

	const data = req.body;

	// saving current conf
	const settingsClone = clone(confMgmt.getNexlSettingsCached());

	// removing nexl home dir from data, because it's not a part of setting
	delete data[confConsts.NEXL_HOME_DEF];

	// checking LDAP password stub
	if (data[confConsts.SETTINGS.LDAP_BIND_PASSWORD] === confConsts.PASSWORD_STUB) {
		// replacing password stub with real password
		data[confConsts.SETTINGS.LDAP_BIND_PASSWORD] = settingsClone[confConsts.SETTINGS.LDAP_BIND_PASSWORD];
	}

	return confMgmt.saveSettings(data)
		.then(_ => applyChanges(settingsClone))
		.then(_ => {
			res.send({});
			logger.log.log('verbose', `Successfully saved nexl server settings by [${username}] user`);
		}).catch(
			(err) => {
				logger.log.error('Failed to save settings. Reason : [%s]', err);
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
