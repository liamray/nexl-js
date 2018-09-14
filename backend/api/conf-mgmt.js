const path = require('path');
const fsx = require('./fsx');
const fse = require('fs-extra');
const j79 = require('j79-utils');
const osHomeDir = require('os-homedir');

const version = require('./../../package.json').version;

const confConsts = require('../common/conf-constants');
const securityConsts = require('../common/security-constants');
const cmdLineArgs = require('./cmd-line-args');
const utils = require('./utils');
const logger = require('./logger');
const schemas = require('../common/schemas');
const schemaValidation = require('./schema-validation');

let NEXL_HOME_DIR;
let ALL_SETTINGS_CACHED = {};

// --------------------------------------------------------------------------------
// api

function getConfFileFullPath(fileName) {
	return path.join(NEXL_HOME_DIR, fileName);
}

function loadDefaultValues(defValue) {
	if (j79.isPrimitive(defValue)) {
		return defValue;
	}

	if (j79.isFunction(defValue)) {
		return defValue();
	}

	if (j79.isArray(defValue)) {
		const result = [];
		for (let index in defValue) {
			let item = defValue[index];
			item = loadDefaultValues(item);
			result.push(item);
		}
		return result;
	}

	if (j79.isObject(defValue)) {
		const result = {};
		for (let key in defValue) {
			let val = defValue[key];
			val = loadDefaultValues(val);
			result[key] = val;
		}

		return result;
	}

	throw 'Bad default value';
}

function loadInner(fullPath, fileName) {
	return fsx.readFile(fullPath, {encoding: confConsts.ENCODING_UTF8})
		.then(
			(fileBody) => {
				// JSONing. The JSON must be an object which contains config version and the data itself
				let conf;
				try {
					conf = JSON.parse(fileBody);
				} catch (e) {
					logger.log.error('The [%s] config file is damaged or broken. Reason : [%s]', fullPath, e.toString());
					return Promise.reject('Config file is damaged or broken');
				}

				const version = conf['version'];
				const data = conf['data'];

				logger.log.debug('The [%s] file is loaded. Config version is [%s]', fullPath, version);

				// validating data
				const validationResult = schemaValidation(data, schemas.SCHEMAS[fileName], schemas.GROUP_VALIDATIONS[fileName]);
				if (!validationResult.isValid) {
					logger.log.error(`Config validation failed for [${fileName}] while loading. Reason : [${validationResult.err}]`);
					return Promise.reject(validationResult.err);
				}

				// updating cache
				ALL_SETTINGS_CACHED[fileName] = data;

				return Promise.resolve(data);
			});
}

function isConfFileDeclared(fileName) {
	for (let key in confConsts.CONF_FILES) {
		if (confConsts.CONF_FILES[key] === fileName) {
			return true;
		}
	}

	return false;
}

function load(fileName, saveIfNotExists) {
	logger.log.debug('Loading config from [%s] file', fileName);

	if (!isConfFileDeclared(fileName)) {
		logger.log.error('The [%s] file is undeclared and cannot be loaded');
		return Promise.reject('Undeclared configuration file cannot be loaded');
	}

	const fullPath = getConfFileFullPath(fileName);

	return fsx.exists(fullPath).then(
		(isExists) => {
			if (isExists) {
				return loadInner(fullPath, fileName);
			}

			// file doesn't exist, loading defaults
			logger.log.debug('The [%s] file doesn\'t exist. Loading empty data', fullPath);

			// applying default values
			const result = loadDefaultValues(schemas.DEF_VALUES[fileName]);

			// updating cache
			ALL_SETTINGS_CACHED[fileName] = result;

			if (saveIfNotExists) {
				return save(result, fileName).then(_ => result);
			} else {
				return Promise.resolve(result);
			}
		});
}

function save(data, fileName) {
	logger.log.debug('Saving config to [%s] file', fileName);

	if (!isConfFileDeclared(fileName)) {
		logger.log.error('The [%s] file is undeclared and cannot be saved', fileName);
		return Promise.reject('Undeclared configuration file cannot be saved');
	}

	const fullPath = getConfFileFullPath(fileName);

	// validating data before save
	const validationResult = schemaValidation(data, schemas.SCHEMAS[fileName], schemas.GROUP_VALIDATIONS[fileName]);
	if (!validationResult.isValid) {
		logger.log.error(`Config validation failed for [${fileName}] while saving. Reason : [${validationResult.err}]`);
		return Promise.reject(validationResult.err);
	}

	// preparing for save
	let conf = {
		version: version,
		data: data
	};

	try {
		conf = JSON.stringify(conf, null, 2);
	} catch (e) {
		logger.log.error('Failed to stringify object while saving the [%s] file. Reason : [%s]', fullPath, utils.formatErr(e));
		return Promise.reject('Bad data format');
	}

	// saving...
	return fsx.writeFile(fullPath, conf, {encoding: confConsts.ENCODING_UTF8})
		.then(_ => {
			// updating cache
			ALL_SETTINGS_CACHED[fileName] = data;
			return Promise.resolve();
		});
}

function loadSettings(saveIfNotExists) {
	return load(confConsts.CONF_FILES.SETTINGS, saveIfNotExists);
}

function saveSettings(settings) {
	return save(settings, confConsts.CONF_FILES.SETTINGS);
}

function initNexlHomeDir() {
	const cmdLineOpts = cmdLineArgs.init();
	NEXL_HOME_DIR = cmdLineOpts[confConsts.NEXL_HOME_DEF] || path.join(osHomeDir(), '.nexl', 'app-data');

	// create dir structure if needed, preload settings and save them if needed
	return fse.mkdirs(NEXL_HOME_DIR).then(_ => loadSettings(true));
}

function preloadConfs() {
	return Promise.resolve()
		.then(_ => load(confConsts.CONF_FILES.USERS, true))
		.then(_ => load(confConsts.CONF_FILES.PERMISSIONS, true))
		.then(_ => load(confConsts.CONF_FILES.ADMINS, true));
}

function createJSFilesRootDirIfNeeded() {
	const nexlStorageDir = ALL_SETTINGS_CACHED[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.JS_FILES_ROOT_DIR];
	return fse.mkdirs(nexlStorageDir)
		.then(_ => Promise.resolve(logger.log.importantMessage('info', `nexl storage dir is [${nexlStorageDir}]`)));
}

function getLDAPSettings() {
	let ldapSettings = {
		url: ALL_SETTINGS_CACHED[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_URL],
		baseDN: ALL_SETTINGS_CACHED[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_BASE_DN],
		bindDN: ALL_SETTINGS_CACHED[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_BIND_DN],
		bindPassword: ALL_SETTINGS_CACHED[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_BIND_PASSWORD],
		findBy: ALL_SETTINGS_CACHED[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_FIND_BY]
	};

	if (utils.isEmptyStr(ldapSettings.url)) {
		return undefined;
	}

	return ldapSettings;
}


function reloadCache() {
	const promises = [];
	for (let key in confConsts.CONF_FILES) {
		const val = confConsts.CONF_FILES[key];
		promises.push(Promise.resolve(val).then(load));
	}

	return Promise.all(promises);
}

// --------------------------------------------------------------------------------
module.exports.createJSFilesRootDirIfNeeded = createJSFilesRootDirIfNeeded;

module.exports.initNexlHomeDir = initNexlHomeDir;
module.exports.preloadConfs = preloadConfs;

module.exports.load = load;
module.exports.save = save;

module.exports.loadSettings = loadSettings;
module.exports.saveSettings = saveSettings;

module.exports.getNexlHomeDir = () => NEXL_HOME_DIR;
module.exports.getJSFilesRootDir = () => ALL_SETTINGS_CACHED[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.JS_FILES_ROOT_DIR];
module.exports.getNexlSettingsCached = () => ALL_SETTINGS_CACHED[confConsts.CONF_FILES.SETTINGS];

module.exports.getCached = (fileName) => ALL_SETTINGS_CACHED[fileName];

module.exports.reloadCache = reloadCache;

module.exports.getLDAPSettings = getLDAPSettings;
// --------------------------------------------------------------------------------
