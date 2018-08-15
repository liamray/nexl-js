const path = require('path');
const fsx = require('./fsx');
const j79 = require('j79-utils');
const osHomeDir = require('os-homedir');

const version = require('./../../package.json').version;

const confConsts = require('../common/conf-constants');
const securityConsts = require('../common/security-constants');
const cmdLineArgs = require('./cmd-line-args');
const utils = require('./utils');
const security = require('./security');
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
	return fsx.readFile(fullPath, {encoding: confConsts.ENCODING_UTF8}).then(
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

function load(fileName) {
	logger.log.debug('Loading config from [%s] file', fileName);

	if (!isConfFileDeclared(fileName)) {
		logger.log.error('The [%s] file is undeclared and cannot be loaded');
		return Promise.reject('Undeclared configuration file cannot be loaded');
	}

	const fullPath = getConfFileFullPath(fileName);

	return Promise.resolve(fullPath).then(fsx.exists).then(
		(isExists) => {
			if (isExists) {
				return loadInner(fullPath, fileName);
			}

			// file doesn't exist, loading defaults
			logger.log.debug('The [%s] file doesn\'t exist. Loading empty data', fullPath);

			// applying default values
			let result = loadDefaultValues(schemas.DEF_VALUES[fileName]);

			// updating cache
			ALL_SETTINGS_CACHED[fileName] = result;

			return Promise.resolve(result);
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

function loadSettings() {
	return load(confConsts.CONF_FILES.SETTINGS);
}

function saveSettings(settings) {
	return save(settings, confConsts.CONF_FILES.SETTINGS);
}

function init() {
	let cmdLineOpts = cmdLineArgs.init();
	NEXL_HOME_DIR = cmdLineOpts[confConsts.NEXL_HOME_DEF] || path.join(osHomeDir(), '.nexl');
}

function isConfFileExists(fileName) {
	return fsx.join(NEXL_HOME_DIR, fileName).then(fsx.exists);
}

function initSettings() {
	logger.log.debug('Initializing settings');

	return isConfFileExists(confConsts.CONF_FILES.SETTINGS).then(
		(isExists) => {
			return loadSettings().then(
				(settings) => {
					if (isExists) {
						return Promise.resolve();
					} else {
						const settingsFileFullPath = path.join(NEXL_HOME_DIR, confConsts.CONF_FILES.SETTINGS);
						logger.log.info(`Loading DEFAULT SETTINGS. Probably you have to adjust your HTTP binding and port. Edit the [${settingsFileFullPath}] settings file if needed and then restart nexl server`);
						return saveSettings(settings);
					}
				});
		});
}

function initPermissions() {
	logger.log.debug('Initializing permissions');

	return isConfFileExists(confConsts.CONF_FILES.PERMISSIONS).then(
		(isExists) => {
			if (isExists) {
				return load(confConsts.CONF_FILES.PERMISSIONS); // preloading permissions
			}

			logger.log.info('The [%s] file doesn\'t exist in [%s] directory. Creating a new one with a default permissions for the following users : [%s, %s]', confConsts.CONF_FILES.PERMISSIONS, NEXL_HOME_DIR, securityConsts.GUEST_USER, securityConsts.AUTHENTICATED);
			const permission = {};
			permission[securityConsts.GUEST_USER] = {
				read: true,
				write: true
			};
			permission[securityConsts.AUTHENTICATED] = {
				read: true,
				write: true
			};
			return save(permission, confConsts.CONF_FILES.PERMISSIONS);
		}
	)
}

function initUsers() {
	logger.log.debug('Initializing users');

	return isConfFileExists(confConsts.CONF_FILES.USERS)
		.then((isExists) => {
			if (isExists) {
				// okay, file exists, preloading
				return load(confConsts.CONF_FILES.USERS);
			}

			logger.log.info(`The [${confConsts.CONF_FILES.USERS}] file doesn't exist. Creating default file`);

			// not exists, creating admin user and registration token
			const users = {};
			let token = utils.generateNewToken();
			users[securityConsts.ADMIN_USER] = {
				token2ResetPassword: token
			};

			logger.log.importantMessage('info', `Use the following token [${token.token}] to register [${securityConsts.ADMIN_USER}] account. This token is valid for [${security.TOKEN_VALID_HOURS}] hour(s). If token expires just delete the [${confConsts.CONF_FILES.USERS}] file located in [${NEXL_HOME_DIR}] directory and restart nexl app`);

			return save(users, confConsts.CONF_FILES.USERS);
		});
}

function initAdmins() {
	logger.log.debug('Initializing admins conf');

	return isConfFileExists(confConsts.CONF_FILES.ADMINS).then(
		(isExists) => {
			if (isExists) {
				return load(confConsts.CONF_FILES.ADMINS); // preloading admins
			}

			logger.log.info('The [%s] file doesn\'t exist in [%s] directory. Creating a new one with a [%s] user', confConsts.CONF_FILES.ADMINS, NEXL_HOME_DIR, securityConsts.ADMIN_USER);
			const admins = [securityConsts.ADMIN_USER];
			return save(admins, confConsts.CONF_FILES.ADMINS);

		}
	)
}

function createNexlHomeDirectoryIfNeeded() {
	return fsx.exists(NEXL_HOME_DIR).then(
		(isExists) => {
			if (isExists) {
				return fsx.stat(NEXL_HOME_DIR).then(
					(stat) => {
						if (stat.isDirectory()) {
							logger.log.debug('The [%s] nexl home directory exists', NEXL_HOME_DIR);
							return Promise.resolve();
						} else {
							logger.log.error(`The [${NEXL_HOME_DIR}] nexl home directory points to existing file ( or something else ). Recreate it as a directory or use another nexl home directory in the following way :\nnexl --${confConsts.NEXL_HOME_DEF}=/path/to/nexl/home/directory`);
							return Promise.reject('nexl home directory probably points to existing file or something else');
						}
					});
			}

			return fsx.mkdir(NEXL_HOME_DIR).then(
				() => {
					logger.log.info('The [%s] nexl home dir has been created', NEXL_HOME_DIR);
					return Promise.resolve();
				});
		});
}

function createJSFilesRootDirIfNeeded() {
	const jsFilesRootDir = ALL_SETTINGS_CACHED[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.JS_FILES_ROOT_DIR];

	return fsx.exists(jsFilesRootDir).then(
		(isExists) => {
			if (!isExists) {
				logger.log.info('The [%s] JS files root dir doesn\'t exist. Creating...', jsFilesRootDir);
				return fsx.mkdir(jsFilesRootDir);
			}

			return fsx.stat(jsFilesRootDir).then(
				(stat) => {
					if (stat.isDirectory()) {
						logger.log.debug('The [%s] js files root dir exists', jsFilesRootDir);
						return Promise.resolve();
					} else {
						logger.log.error('The [%s] js files root directory points to existing file ( or something else ). Recreate it as a directory or use another directory ', jsFilesRootDir);
						return Promise.reject('JS files root directory probably points to existing file or something else');
					}
				}
			);
		}
	).then(_ => {
		logger.log.importantMessage('info', `JavaScript files home dir is [${jsFilesRootDir}]`);
		return Promise.resolve();
	});
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
module.exports.init = init;
module.exports.createNexlHomeDirectoryIfNeeded = createNexlHomeDirectoryIfNeeded;
module.exports.createJSFilesRootDirIfNeeded = createJSFilesRootDirIfNeeded;
module.exports.initSettings = initSettings;
module.exports.initPermissions = initPermissions;
module.exports.initUsers = initUsers;
module.exports.initAdmins = initAdmins;

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
