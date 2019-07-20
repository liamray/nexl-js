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
const nexlInstanceVersion = require('./../../package.json').version;

CONF_VERSIONS =
	[
		// example #1: adding a new [X] field to the [settings.js] file
		/*
				{
					version: '3.5.0',
					action: (data) => {
						logger.log.info('Adding a [X] field to the [setting.js] file');
						data['settings.js']['data']['x'] = [];
					}
				}
		*/

		// example #2: deleting a [settings.js] file
		/*
				{
					version: '3.5.0',
					action: (data) => {
						logger.log.info('Removing a [settings.js] file, not in use anymore');
						delete data['settings.js'];
					}
				}
		*/
	];

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
			logger.log.error(`The [${fileName}] file is not a valid JSON file`);
			throw e;
		}
	}

	return confFilesContent;
}

function validateFilesVersion(confFilesContent) {
	let version;

	for (let fileName in confFilesContent) {
		// resolving file version
		const fileVersion = confFilesContent[fileName].version;

		// checking file version
		if (!j79.isString(fileVersion) || fileVersion.length < 1) {
			throw `The [version] field in the [${fileName}] file must be a valid string`;
		}

		// first time initialization
		version = ( version === undefined) ? fileVersion : version;

		// comparing versions
		if (version !== fileVersion) {
			throw `nexl configuration files from the [${confMgmt.APP_DATA_DIR}] directory must have same version. Found two different versions: [${version}] and [${fileVersion}]`;
		}
	}

	return version;
}

function validateFilesVersionVsInstanceVersion(confFilesVersion) {
	if (confFilesVersion <= nexlInstanceVersion) {
		// valid => conf files version is lower-equals to version
		return;
	}

	// nexl instance version is lower than conf files version
	// it can be still valid if conf files version didn't change. checking...
	const latestUpdateVersion = CONF_VERSIONS[CONF_VERSIONS.length - 1].version;
	if (nexlInstanceVersion > CONF_VERSIONS[CONF_VERSIONS.length - 1].version) {
		// valid => no changes in JSON structure
		return;
	}

	throw`The [${nexlInstanceVersion}] nexl server instance cannot run with a [${confFilesVersion}] configuration files. As a work around you can delete all conf files from the [${confMgmt.getNexlAppDataDir()}] directory ( backup it before ) and restart nexl server.`;
}

function findApproptiateVersion2StartMigration(confFileVersion) {
	let versionIndex = -1;

	for (let index = CONF_VERSIONS.length - 1; index >= 0; index--) {
		if (confFileVersion < CONF_VERSIONS[index].version && CONF_VERSIONS[index].version <= nexlInstanceVersion) {
			versionIndex = index;
		}
	}

	return versionIndex;
}

function backUpAppDataDir(appDataDir) {
	const backupDirName = confMgmt.APP_DATA_DIR + '-BACKUP-' + dateFormat(new Date(), 'yyyy-mm-dd--HH-MM-ss--l');
	const backupFullPath = path.join(appDataDir, '..', backupDirName);
	try {
		fse.copySync(appDataDir, backupFullPath);
	} catch (e) {
		logger.log.error(`Cannot backup a [${appDataDir}] directory to [${backupFullPath}] directory`);
		throw e;
	}
}


function performSchemaValidation(confFilesContent) {
	// running schema validation
	for (let fileName in confFilesContent) {
		const validationResult = schemaValidation(confFilesContent[fileName].data, schemas.SCHEMAS[fileName], schemas.GROUP_VALIDATIONS[fileName]);
		if (!validationResult.isValid) {
			logger.log.error(`The [${fileName}] configuration file is broken or has invalid data structure. As a work around you can delete this file from the [${confMgmt.getNexlAppDataDir()}] dir ( don't forget to backup it before ) and start nexl server again.`);
			throw validationResult.err;
		}
	}
}

function migrateFiles(confFilesContent, confFilesList, versionIndex2Migrate) {
	logger.log.info(`Migrating configuration files in [${confMgmt.getNexlAppDataDir()}] dir. Migrating from the [${CONF_VERSIONS[versionIndex2Migrate].version}]..[${CONF_VERSIONS[CONF_VERSIONS.length - 1].version}] version`);
	for (let index = versionIndex2Migrate; index < CONF_VERSIONS.length; index++) {
		CONF_VERSIONS[index].action(confFilesContent);
	}
}

function upgradeConfFilesVersion(confFilesContent, confFilesVersion) {
	logger.log.info(`Updating configuration files from from the [${confFilesVersion}] version to the [${nexlInstanceVersion}] version`);
	for (let fileName in confFilesContent) {
		// updating version to the latest one
		confFilesContent[fileName].version = nexlInstanceVersion;
	}
}

function removeDeletedConfFiles(confFilesContent, confFilesList) {
	// deleting unused files by comparing the initial and final state
	// initial state is a [confFilesList] and final state is a [confFilesContent]
	const newConfFilesList = Object.keys(confFilesContent);
	for (let index in confFilesList) {
		const fileName = confFilesList[index];

		if (newConfFilesList.indexOf(fileName) >= 0) {
			continue;
		}

		// deleting unused conf file
		const fullPath = path.join(confMgmt.getNexlAppDataDir(), fileName);
		logger.log.info(`Deleting a [${fullPath}] conf file. It's not in use anymore`);
		try {
			fs.unlinkSync(fullPath);
		} catch (e) {
			logger.log.error(`Failed to delete a [${fullPath}] file.`);
			throw e;
		}
	}
}

function overwriteFiles(confFilesContent) {
	// overwriting config files
	for (let fileName in confFilesContent) {
		const fullPath = path.join(confMgmt.getNexlAppDataDir(), fileName);
		try {
			fs.writeFileSync(fullPath, confMgmt.stringifyConfig(confFilesContent[fileName]), {encoding: confConsts.ENCODING_UTF8});
		} catch (e) {
			logger.log.error(`Failed to overwrite a [${fullPath}] file.`);
			throw e;
		}
	}
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

	// configuration files version must be <= than nexl instance version
	validateFilesVersionVsInstanceVersion(confFilesVersion);

	// searching for an appropriate version to migrate
	const versionIndex2Migrate = findApproptiateVersion2StartMigration(confFilesVersion);

	// should we overwrite files ?
	let isOverwriteFiles = false;

	// files migration
	if (versionIndex2Migrate >= 0) {
		isOverwriteFiles = true;
		migrateFiles(confFilesContent, confFilesList, versionIndex2Migrate);
	}

	// version upgrade
	if (confFilesVersion !== nexlInstanceVersion) {
		isOverwriteFiles = true;
		upgradeConfFilesVersion(confFilesContent, confFilesVersion);
	}

	// validating files content
	performSchemaValidation(confFilesContent);

	// should we overwrite files ?
	if (!isOverwriteFiles) {
		logger.log.debug('All configuration files are updated. Nothing to migrate');
		return;
	}

	// backing up an [app-dir] dir
	backUpAppDataDir(confMgmt.getNexlAppDataDir());

	// physically remove deleted conf files
	removeDeletedConfFiles(confFilesContent, confFilesList);

	// overwriting files
	overwriteFiles(confFilesContent);

	logger.log.info('Configuration migration performed successfully !!!');
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