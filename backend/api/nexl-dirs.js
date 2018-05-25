const path = require('path');
const fs = require('fs');
const fsx = require('./fsx');
const util = require('util');

const utils = require('./utils');
const confMgmt = require('./conf-mgmt');
const security = require('./security');
const logger = require('./logger');

function isConfFileExists(fileName) {
	return fsx.join(confMgmt.getNexlHomeDir(), fileName).then(fsx.exists);
}

function initSettings() {
	logger.log.debug('Initializing settings');

	return isConfFileExists(confMgmt.CONF_FILES.SETTINGS).then(
		(isExists) => {
			return confMgmt.loadSettings().then(
				(settings) => {
					if (isExists) {
						return Promise.resolve();
					} else {
						return confMgmt.saveSettings(settings);
					}
				});
		});
}

function initTokens() {
	logger.log.debug('Initializing tokens');

	return isConfFileExists(confMgmt.CONF_FILES.TOKENS).then(
		(isExists) => {
			if (!isExists) {
				logger.log.info('The [%s] file doesn\'t exist in [%s] directory. Creating a new one and generating token for [%s] user', confMgmt.CONF_FILES.TOKENS, confMgmt.getNexlHomeDir(), utils.ADMIN_USERNAME);
				logger.log.info('------> Use a token stored in [%s] file located in [%s] directory to register a [%s] account', confMgmt.CONF_FILES.TOKENS, confMgmt.getNexlHomeDir(), utils.ADMIN_USERNAME);
				return security.generateTokenAndSave(utils.ADMIN_USERNAME);
			}
		}
	)
}

function initPermissions() {
	logger.log.debug('Initializing permissions');

	return isConfFileExists(confMgmt.CONF_FILES.PERMISSIONS).then(
		(isExists) => {
			if (!isExists) {
				logger.log.info('The [%s] file doesn\'t exist in [%s] directory. Creating a new one with a default permissions for [%s] user', confMgmt.CONF_FILES.PERMISSIONS, confMgmt.getNexlHomeDir(), utils.UNAUTHORIZED_USERNAME);
				const permission = {};
				permission[utils.UNAUTHORIZED_USERNAME] = {
					read: true,
					write: true
				};
				return confMgmt.save(permission, confMgmt.CONF_FILES.PERMISSIONS);
			}
		}
	)
}

function initPasswords() {
	logger.log.debug('Initializing passwords');

	// preloading passwords to store them in cache
	return confMgmt.load(confMgmt.CONF_FILES.PASSWORDS);
}

function initAdmins() {
	logger.log.debug('Initializing admins conf');

	return isConfFileExists(confMgmt.CONF_FILES.ADMINS).then(
		(isExists) => {
			if (!isExists) {
				logger.log.info('The [%s] file doesn\'t exist in [%s] directory. Creating a new one with a [%s] user', confMgmt.CONF_FILES.ADMINS, confMgmt.getNexlHomeDir(), utils.ADMIN_USERNAME);
				const admins = [utils.ADMIN_USERNAME];
				return confMgmt.save(admins, confMgmt.CONF_FILES.ADMINS);
			}
		}
	)
}

function createNexlHomeDirectoryIfNeeded() {
	return fsx.exists(confMgmt.getNexlHomeDir()).then((isExists) => {
		if (isExists) {
			return fsx.stat(confMgmt.getNexlHomeDir()).then((stat) => {
				if (stat.isDirectory()) {
					logger.log.debug('The [%s] nexl home directory exists', confMgmt.getNexlHomeDir());
					return Promise.resolve();
				} else {
					logger.log.error('The [%s] nexl home directory points to existing file ( or something else ). Recreate it as a directory or use another nexl home directory in the following way :\nnexl --nexl-home=/path/to/nexl/home/directory', confMgmt.getNexlHomeDir());
					return Promise.reject('nexl home directory probably points to existing file or something else');
				}
			});
		} else {
			return fsx.mkdir(confMgmt.getNexlHomeDir()).then(() => {
				logger.log.info('The [%s] nexl home dir has been created', confMgmt.getNexlHomeDir());
				return Promise.resolve();
			});
		}
	});
}

// --------------------------------------------------------------------------------
module.exports.createNexlHomeDirectoryIfNeeded = createNexlHomeDirectoryIfNeeded;
module.exports.initSettings = initSettings;
module.exports.initTokens = initTokens;
module.exports.initPermissions = initPermissions;
module.exports.initPasswords = initPasswords;
module.exports.initAdmins = initAdmins;
// --------------------------------------------------------------------------------
