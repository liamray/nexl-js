const confMgmt = require('./conf-mgmt');
const confConsts = require('../common/conf-constants');
const logger = require('./logger');
const fsx = require('./fsx');
const path = require('path');
const fse = require('fs-extra');
const fs = require('fs');
const dateFormat = require('dateformat');
const j79 = require('j79-utils');
const schemas = require('../common/schemas');
const schemaValidation = require('./schema-validation');
const version = require('./../../package.json').version;

CONF_VERSIONS =
	[
		{
			version: '3.3.0',
			action: (data) => {
				logger.log.info('Migrating a [setting.js] config to [3.3.0] version');
				data['settings.js']['data']['webhooks'] = [];
			}
		}
	]
;

function gatherConfFiles() {
	const appDataDir = confMgmt.getNexlAppDataDir();

	// loading files list
	logger.log.debug(`Loading files from the [${appDataDir}] dir`);
	let confFiles;
	try {
		confFiles = fs.readdirSync(appDataDir);
	} catch (e) {
		logger.log.error(`Failed to load files list from the [${appDataDir}] dir`);
		throw e;
	}

	// iterating over files and reading their content
	logger.log.debug(`Reading files content from the [${appDataDir}] dir`);
	const confFilesContent = {};
	for (let index = 0; index < confFiles.length; index++) {
		const fileName = confFiles[index];
		const fullPath = path.join(appDataDir, fileName);

		// is it a file ?
		try {
			if (!fs.lstatSync(fullPath).isFile()) {
				continue;
			}
		} catch (e) {
			logger.log.error(`Failed to resolve a file stat for the [${fullPath}] file`);
			throw e;
		}

		// reading file content
		try {
			confFilesContent[fileName] = fs.readFileSync(fullPath, {encoding: confConsts.ENCODING_UTF8});
		} catch (e) {
			logger.log.error(`Failed to read the [${fullPath}] file content`);
			throw e;
		}

		// parsing JSON
		try {
			confFilesContent[fileName] = JSON.parse(confFilesContent[fileName]);
		} catch (e) {
			logger.log.error(`Failed to parse a [${fileName}] file as JSON`);
			throw e;
		}
	}

	return confFilesContent;
}

function validateFilesVersion(confFilesContent) {
	let version;

	for (let fileName in confFilesContent) {
		let contentAsJson;

		// resolving file version
		const fileVersion = confFilesContent[fileName].version;

		// checking file version
		if (!j79.isString(fileVersion) || fileVersion.length < 1) {
			logger.log.error(`The [version] field in the [${fileName}] file must be a valid string`);
			throw `Invalid version in the [${fileName}] file`;
		}

		// first time initialization
		version = ( version === undefined) ? fileVersion : version;

		// comparing versions
		if (version !== fileVersion) {
			logger.log.error(`nexl configuration files from the [${confMgmt.APP_DATA_DIR}] directory must have same version. Found two different versions: [${version}] and [${fileVersion}]`);
			throw `Configuration files has different versions`;
		}
	}

	return version;
}

function findMinVersionIndex2Migrate(confFileVersion) {
	let versionIndex = CONF_VERSIONS.length - 1;

	for (let index = CONF_VERSIONS.length - 1; index >= 0; index--) {
		if (confFileVersion < CONF_VERSIONS[index].version) {
			versionIndex = index;
		}
	}

	return versionIndex;
}

function backUpAppDataDir(appDataDir) {
	const backupDir = path.join(appDataDir, '..', dateFormat(new Date(), 'yyyy-mm-dd--HH-MM-ss--l'));
	try {
		fse.copySync(appDataDir, backupDir);
	} catch (e) {
		logger.log.error(`Cannot backup a [${appDataDir}] directory to [${backupDir}] directory`);
		throw e;
	}
}

function performMigration(versionIndex2Migrate, confFilesList, confFilesContent) {
	const appDataDir = confMgmt.getNexlAppDataDir();

	// backing up an [app-dir] dir
	backUpAppDataDir(appDataDir);

	// migrating
	logger.log.info(`Migrating configuration files from [${confMgmt.APP_DATA_DIR}] dir. Migration from the [${CONF_VERSIONS[versionIndex2Migrate].version}] version`);
	for (let index = versionIndex2Migrate; index < CONF_VERSIONS.length; index++) {
		CONF_VERSIONS[index].action(confFilesContent);
	}

	// tuning up
	for (let fileName in confFilesContent) {
		// updating version to the latest one
		confFilesContent[fileName].version = version;

		// running schema validation
		const validationResult = schemaValidation(confFilesContent[fileName]['data'], schemas.SCHEMAS[fileName], schemas.GROUP_VALIDATIONS[fileName]);

		if (!validationResult.isValid) {
			logger.log.error(`Something went wrong with nexl configuration files migration from the [${appDataDir}]. All files have been migrated but the [${fileName}] file has wrong structure. As a work around you can delete a [${appDataDir}] and restart nexl server ( but you will loss all nexl server settings )`);
			throw `Config validation failed for [${fileName}] while loading. Reason : [${validationResult.err}]`;
		}
	}

	// deleting unused file by comparing the initial and final state
	// initial state is a [confFilesList] and final state is a [confFilesContent]
	const newConfFilesList = Object.keys(confFilesContent);
	for (let index in confFilesList) {
		const fileName = confFilesList[index];

		if (newConfFilesList.indexOf(fileName) >= 0) {
			continue;
		}

		// deleting unused conf file
		const fullPath = path.join(appDataDir, fileName);
		logger.log.info(`Deleting a [${fullPath}] conf file. It's not in use anymore`);
		try {
			fs.unlinkSync(fullPath);
		} catch (e) {
			logger.log.error(`Failed to delete a [${fullPath}] file.`);
			throw e;
		}
	}

	// overwriting config files
	for (let fileName in confFilesContent) {
		const fullPath = path.join(appDataDir, fileName);
		try {
			fs.writeFileSync(fullPath, confMgmt.stringifyConfig(confFilesContent[fileName]), {encoding: confConsts.ENCODING_UTF8});
		} catch (e) {
			logger.log.error(`Failed to overwrite a [${fullPath}] file.`);
			throw e;
		}
	}

	logger.log.info('Configuration migration performed successfully !!!');
}

function migrateAppDataInner() {
	logger.log.debug('Checking nexl configuration files version. Some files might be automatically migrated.');

	// gathering conf files
	const confFilesContent = gatherConfFiles();
	const confFilesList = Object.keys(confFilesContent);

	// checking
	if (confFilesList.length < 1) {
		logger.log.debug('There no files to migrate');
		return;
	}

	// validating files versions
	const confFilesVersion = validateFilesVersion(confFilesContent);

	// searching for an appropriate version to migrate
	const versionIndex2Migrate = findMinVersionIndex2Migrate(confFilesVersion);

	// should we migrate at all ?
	if (versionIndex2Migrate >= CONF_VERSIONS.length) {
		logger.log.debug(`Configuration files in [${confMgmt.APP_DATA_DIR}] dir are already updated to the latest version.`);
		return;
	}

	// back
	performMigration(versionIndex2Migrate, confFilesList, confFilesContent);
}

function migrateAppData() {
	try {
		migrateAppDataInner();
	} catch (e) {
		return Promise.reject(`Failed to perform nexl configuration migration. Reason: ${e}`);
	}

	return Promise.resolve();
}

// --------------------------------------------------------------------------------
module.exports = migrateAppData;
// --------------------------------------------------------------------------------

// JUST THROW ERROR WITHOUT LOGGING
// there is no logging at this step, think about it