const path = require('path');
const fs = require('fs');
const fsx = require('./fsx');
const util = require('util');

const utils = require('./utils');
const confMgmt = require('./conf-mgmt');
const security = require('./security');
const logger = require('./logger');

function isConfFileExists(fileName) {
	return fsx.join(confMgmt.NEXL_HOME_DIR, fileName).then(fsx.exists);
}

function initNexlHomeDir() {
	logger.log.debug('Creating default configuration files if absent in [%s] nexl home dir', confMgmt.NEXL_HOME_DIR);
	const promises = [];

	// creating tokens file is not exists
	promises.push(isConfFileExists(confMgmt.CONF_FILES.TOKENS).then(
		(isExists) => {
			if (!isExists) {
				logger.log.info('The [%s] file doesn\'t exist in [%s] directory. Creating a new one and generating token for [%s] user', confMgmt.CONF_FILES.TOKENS, confMgmt.NEXL_HOME_DIR, utils.ADMIN_USERNAME);
				security.generateTokenAndSave(utils.ADMIN_USERNAME);
				logger.log.info('------> Use a token stored in [%s] file located in [%s] directory to register a [%s] account', confMgmt.CONF_FILES.TOKENS, confMgmt.NEXL_HOME_DIR, utils.ADMIN_USERNAME);
			}
		}
	));

	// creating admins file if not exists
	promises.push(isConfFileExists(confMgmt.CONF_FILES.ADMINS).then(
		(isExists) => {
			if (!isExists) {
				logger.log.info('The [%s] file doesn\'t exist in [%s] directory. Creating a new one with a [%s] user', confMgmt.CONF_FILES.ADMINS, confMgmt.NEXL_HOME_DIR, utils.ADMIN_USERNAME);
				const admins = [utils.ADMIN_USERNAME];
				confMgmt.save(admins, confMgmt.CONF_FILES.ADMINS);
			}
		}
	));

	// creating permissions file if not exists
	promises.push(isConfFileExists(confMgmt.CONF_FILES.PERMISSIONS).then(
		(isExists) => {
			if (!isExists) {
				logger.log.info('The [%s] file doesn\'t exist in [%s] directory. Creating a new one with a default permissions for [%s] user', confMgmt.CONF_FILES.PERMISSIONS, confMgmt.NEXL_HOME_DIR, utils.UNAUTHORIZED_USERNAME);
				const permission = {};
				permission[utils.UNAUTHORIZED_USERNAME] = {
					read: true,
					write: true
				};
				confMgmt.save(permission, confMgmt.CONF_FILES.PERMISSIONS);
			}
		}
	));

	return Promise.all(promises);
}

function createNexlHomeDirectoryIfNeeded() {
	return fsx.exists(confMgmt.NEXL_HOME_DIR).then((isExists) => {
		if (isExists) {
			return fsx.stat(confMgmt.NEXL_HOME_DIR).then((stat) => {
				if (stat.isDirectory()) {
					logger.log.debug('The [%s] nexl home directory exists', confMgmt.NEXL_HOME_DIR);
					return Promise.resolve();
				} else {
					logger.log.error('The [%s] nexl home directory points to existing file ( or something else ). Recreate it as a directory or use another nexl home directory in the following way :\nnexl --nexl-home=/path/to/nexl/home/directory', confMgmt.NEXL_HOME_DIR);
					return Promise.reject('nexl home directory probably points to existing file or something else');
				}
			});
		} else {
			return fsx.mkdir(confMgmt.NEXL_HOME_DIR).then(() => {
				logger.log.info('The [%s] nexl home dir has been created', confMgmt.NEXL_HOME_DIR);
				return Promise.resolve();
			});
		}
	});
}

function getNexlSourcesDir() {
	return confMgmt.loadAsync(confMgmt.CONF_FILES.SETTINGS).then(
		(settings) => {
			return Promise.resolve(settings[confMgmt.SETTINGS.NEXL_SOURCES_DIR]);
		}
	);
}

function createExamplesFiles(nexlSourcesDir) {
	logger.log.debug('Adding examples.js files to the [%s] nexl sources dir', nexlSourcesDir);
	const examplesSrc = '../backend/resources/examples.js';
	const examplesDest = path.join(nexlSourcesDir, 'examples.js');

	return fsx.readFile(examplesSrc, {encoding: confMgmt.ENCODING_UTF8}).then((fileBody) => {
		return fsx.writeFile(examplesDest, fileBody, {encoding: confMgmt.ENCODING_UTF8});
	});
}

function initNexlSourcesDir() {
	return getNexlSourcesDir().then((nexlSourcesDir) => {
		return fsx.exists(nexlSourcesDir).then((isExists) => {
			// nexl sources dir exists
			if (isExists) {
				return fsx.stat(nexlSourcesDir).then((stat) => {
					if (stat.isDirectory()) {
						logger.log.debug('The [%s] nexl sources directory exists', nexlSourcesDir);
					} else {
						logger.log.error('The [%s] nexl sources directory doesn\'t point to a directory ! ( it points to the file or something else )', nexlSourcesDir);
					}
					return Promise.resolve();
				});
			}

			// nexl sources dir does't exist
			return fsx.mkdir(nexlSourcesDir).then(() => Promise.resolve(nexlSourcesDir)).then(createExamplesFiles);
		});
	});
}

// --------------------------------------------------------------------------------
module.exports.createNexlHomeDirectoryIfNeeded = createNexlHomeDirectoryIfNeeded;
module.exports.initNexlHomeDir = initNexlHomeDir;
module.exports.initNexlSourcesDir = initNexlSourcesDir;
// --------------------------------------------------------------------------------