const path = require('path');
const fs = require('fs');
const util = require('util');
const j79 = require('j79-utils');
const osHomeDir = require('os-homedir');
const version = require('./../../package.json').version;

const cmdLineArgs = require('./cmd-line-args');
const utils = require('./utils');
const security = require('./security');
const logger = require('./logger');
const schemaValidation = require('./schema-validation');

const ENCODING_UTF8 = 'utf8';
const ENCODING_ASCII = 'ascii';
const AVAILABLE_ENCODINGS = [ENCODING_UTF8, ENCODING_ASCII];

const NEXL_HOME_DIR = cmdLineArgs.NEXL_HOME_DIR || path.join(osHomeDir(), '.nexl');

// --------------------------------------------------------------------------------
// files
const CONF_FILES = {
	SETTINGS: 'settings.js', // general settings
	TOKENS: 'tokens.js', // tokens to register a user and reset password
	PASSWORDS: 'passwords.js', // password for login
	ADMINS: 'admins.js', // administrators list
	PERMISSIONS: 'permissions.js' // permissions matrix
};

// --------------------------------------------------------------------------------
// available options for SETTINGS
const SETTINGS = {
	NEXL_SOURCES_DIR: 'nexl-sources-dir',
	NEXL_SOURCES_PATH: 'nexl-sources-path',
	NEXL_SOURCES_ENCODING: 'nexl-sources-encoding',
	HTTP_TIMEOUT: 'http-timeout',
	LDAP_URL: 'ldap-url',

	HTTP_BINDING: 'http-binding',
	HTTP_PORT: 'http-port',
	HTTPS_BINDING: 'https-binding',
	HTTPS_PORT: 'https-port',
	SSL_CERT_LOCATION: 'ssl-cert-location',
	SSL_KEY_LOCATION: 'ssl-key-location',

	LOG_FILE_LOCATION: 'log-file-location',
	LOG_LEVEL: 'log-level',
	LOG_ROTATE_FILE_SIZE: 'log-rotate-file-size-kb',
	LOG_ROTATE_FILES_COUNT: 'log-rotate-files-count',

	NOTIFICATIONS: 'notifications',
};

// --------------------------------------------------------------------------------
// default values
const DEF_VALUES = {};

// SETTINGS default values
DEF_VALUES[CONF_FILES.SETTINGS] = {};
DEF_VALUES[CONF_FILES.SETTINGS][SETTINGS.NEXL_SOURCES_DIR] = () => path.join(osHomeDir(), 'nexl-sources');
DEF_VALUES[CONF_FILES.SETTINGS][SETTINGS.NEXL_SOURCES_ENCODING] = ENCODING_UTF8;
DEF_VALUES[CONF_FILES.SETTINGS][SETTINGS.HTTP_TIMEOUT] = 10;
DEF_VALUES[CONF_FILES.SETTINGS][SETTINGS.HTTP_BINDING] = 'localhost';
DEF_VALUES[CONF_FILES.SETTINGS][SETTINGS.HTTP_PORT] = 3000;
DEF_VALUES[CONF_FILES.SETTINGS][SETTINGS.HTTPS_BINDING] = 'localhost';
DEF_VALUES[CONF_FILES.SETTINGS][SETTINGS.HTTPS_PORT] = 443;
DEF_VALUES[CONF_FILES.SETTINGS][SETTINGS.LOG_FILE_LOCATION] = () => path.join(NEXL_HOME_DIR, 'nexl.log');
DEF_VALUES[CONF_FILES.SETTINGS][SETTINGS.LOG_LEVEL] = 'info';
DEF_VALUES[CONF_FILES.SETTINGS][SETTINGS.LOG_ROTATE_FILES_COUNT] = 999;
DEF_VALUES[CONF_FILES.SETTINGS][SETTINGS.LOG_ROTATE_FILE_SIZE] = 0; // not rotating

// TOKENS default values
DEF_VALUES[CONF_FILES.TOKENS] = [];

// PASSWORDS default values
DEF_VALUES[CONF_FILES.PASSWORDS] = [];

// ADMINS default values
DEF_VALUES[CONF_FILES.ADMINS] = [];

// PERMISSIONS default values
DEF_VALUES[CONF_FILES.PERMISSIONS] = {};


// --------------------------------------------------------------------------------
// validation schemas
const VALIDATION_SCHEMAS = {};

// --------------------------------------------------------------------------------
// SETTINGS validations
VALIDATION_SCHEMAS[CONF_FILES.SETTINGS] = {};
VALIDATION_SCHEMAS[CONF_FILES.SETTINGS][SETTINGS.NEXL_SOURCES_DIR] = (val) => {
	if (!j79.isString(val) || val.length < 1) {
		return 'nexl sources dir must be a non empty string';
	}
};
VALIDATION_SCHEMAS[CONF_FILES.SETTINGS][SETTINGS.NEXL_SOURCES_PATH] = [
	(val) => {
		if (!j79.isString(val)) {
			return 'nexl sources path must be a string';
		}
	}
];
VALIDATION_SCHEMAS[CONF_FILES.SETTINGS][SETTINGS.NEXL_SOURCES_ENCODING] = (val) => {
	if (AVAILABLE_ENCODINGS.indexOf(val) < 0) {
		return 'nexl sources encoding must be one of the following : [' + AVAILABLE_ENCODINGS.join(',') + ']';
	}
};
VALIDATION_SCHEMAS[CONF_FILES.SETTINGS][SETTINGS.HTTP_TIMEOUT] = (val) => {
	if (!j79.isNumber(val) || val < 0 || !Number.isInteger(val)) {
		return 'HTTP timeout must be a positive integer';
	}
};
VALIDATION_SCHEMAS[CONF_FILES.SETTINGS][SETTINGS.LDAP_URL] = () => true;
VALIDATION_SCHEMAS[CONF_FILES.SETTINGS][SETTINGS.HTTP_BINDING] = (val) => {
	if (!j79.isString(val)) {
		return 'HTTP binding must be a string';
	}
};
VALIDATION_SCHEMAS[CONF_FILES.SETTINGS][SETTINGS.HTTP_PORT] = (val) => {
	if (!j79.isNumber(val) || val < 0 || !Number.isInteger(val)) {
		return 'HTTP port be a positive integer';
	}
};
VALIDATION_SCHEMAS[CONF_FILES.SETTINGS][SETTINGS.HTTPS_BINDING] = (val) => {
	if (val !== undefined && !j79.isString(val)) {
		return 'HTTPS binding must be a string';
	}
};
VALIDATION_SCHEMAS[CONF_FILES.SETTINGS][SETTINGS.HTTPS_PORT] = (val) => {
	if (val === undefined) {
		return;
	}

	if (!j79.isNumber(val) || val < 0 || !Number.isInteger(val)) {
		return 'HTTPS port must be a positive integer';
	}
};
VALIDATION_SCHEMAS[CONF_FILES.SETTINGS][SETTINGS.SSL_CERT_LOCATION] = (val) => {
	if (val !== undefined && j79.isString(val) && val.length < 1) {
		return 'SSL certificate location must be a non empty string';
	}
};
VALIDATION_SCHEMAS[CONF_FILES.SETTINGS][SETTINGS.SSL_KEY_LOCATION] = (val) => {
	if (val !== undefined && j79.isString(val) && val.length < 1) {
		return 'SSL key location must be a non empty string';
	}
};
VALIDATION_SCHEMAS[CONF_FILES.SETTINGS][SETTINGS.LOG_FILE_LOCATION] = (val) => {
	if (!j79.isString(val) || val.length < 1) {
		return 'Log file location must be a nont empty string';
	}
};
VALIDATION_SCHEMAS[CONF_FILES.SETTINGS][SETTINGS.LOG_LEVEL] = (val) => {
	if (!j79.isString(val) && logger.getAvailLevels().indexOf(val) < 0) {
		return 'Log level must be of the following : [' + logger.getAvailLevels().join(',') + ']';
	}
};
VALIDATION_SCHEMAS[CONF_FILES.SETTINGS][SETTINGS.LOG_ROTATE_FILE_SIZE] = (val) => {
	if (!j79.isNumber(val) || val < 0 || !Number.isInteger(val)) {
		return 'Log rotate file size must be a positive integer';
	}
};
VALIDATION_SCHEMAS[CONF_FILES.SETTINGS][SETTINGS.LOG_ROTATE_FILES_COUNT] = (val) => {
	if (!j79.isNumber(val) || val < 0 || !Number.isInteger(val)) {
		return 'Log rotate files count must be a positive integer';
	}
};
VALIDATION_SCHEMAS[CONF_FILES.SETTINGS][SETTINGS.NOTIFICATIONS] = [
	(val) => {
		if (!j79.isString(val) && val.length < 0) {
			return 'Notification item must be a non empty string';
		}
	}
];

// --------------------------------------------------------------------------------
// TOKENS validations
VALIDATION_SCHEMAS[CONF_FILES.TOKENS] = {
	'*': (val) => {
		if (!j79.isString(val) || val.length < 1) {
			return 'Each token item must be a non empty string';
		}
	}
};


// --------------------------------------------------------------------------------
// PASSWORDS validations
VALIDATION_SCHEMAS[CONF_FILES.PASSWORDS] = {
	'*': (val) => {
		if (!j79.isString(val) || val.length < 1) {
			return 'Each password item must be a non empty string';
		}
	}
};


// --------------------------------------------------------------------------------
// ADMINS validations
VALIDATION_SCHEMAS[CONF_FILES.ADMINS] = [
	(val) => {
		if (!j79.isString(val) || val.length < 1) {
			return 'Each admin item must be a non empty string';
		}
	}
];


// --------------------------------------------------------------------------------
// PERMISSIONS validations
VALIDATION_SCHEMAS[CONF_FILES.PERMISSIONS] = {
	'*': {
		read: (val) => {
			if (!j79.isBool(val)) {
				return '[read] items must of a boolean type';
			}
		},
		write: (val) => {
			if (!j79.isBool(val)) {
				return '[write] items must of a boolean type';
			}
		}
	}
};


// --------------------------------------------------------------------------------
// api
function resolveFullPath(fileName) {
	return path.join(NEXL_HOME_DIR, fileName);
}

function substDefValues(defValue) {
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
			item = substDefValues(item);
			result.push(item);
		}
		return result;
	}

	if (j79.isObject(defValue)) {
		const result = {};
		for (let key in defValue) {
			let val = defValue[key];
			val = substDefValues(val);
			result[key] = val;
		}

		return result;
	}

	throw 'Bad default value';
}

function setupDefaultValues(data, fileName) {
	// setting upd default values for objects only ( there is no way to do this with arrays )
	if (!j79.isObject(data)) {
		return data;
	}

	const defValues = substDefValues(fileName);

	// iterating over defValues
	for (let key in defValues) {
		if (data[key] !== undefined) {
			continue;
		}

		data[key] = defValues[key];
	}

	return data;
}

function load(fileName) {
	const fullPath = resolveFullPath(fileName);
	logger.log.debug('Loading data from the [%s] file', fullPath);

	// file doesn't exist ?
	if (!fs.existsSync(fullPath)) {
		logger.log.debug('The [%s] file doesn\'t exist. Loading empty data', fullPath);
		return substDefValues(DEF_VALUES[fileName]);
	}


	// loading from file
	let conf = fs.readFileSync(fullPath, ENCODING_UTF8);
	// JSONing. The JSON must be an object which contains config version and the data itself
	conf = JSON.parse(conf);

	const version = conf['version'];
	const data = conf['data'];

	logger.log.debug('Data is loaded, config version is [%s]', version);

	// setting up default values
	return setupDefaultValues(data, fileName);
}

function save(data, fileName) {
	const fullPath = resolveFullPath(fileName);
	logger.log.debug('Saving data into the [%s] file', fullPath);

	// validating
	const schema = VALIDATION_SCHEMAS[fileName];
	const validationResult = schemaValidation(data, schema);

	if (validationResult === undefined) {
		const conf = {
			version: version,
			data: data
		};
		fs.writeFileSync(fullPath, JSON.stringify(conf, null, 2), ENCODING_UTF8);
		return;
	}

	const message = util.format('Data validation error. Reason : %s', validationResult);
	logger.log.error(message);
	throw message;
}

function isConfFileExists(fileName) {
	const fullPath = resolveFullPath(fileName);
	return fs.existsSync(fullPath);
}

function createNexlHomeDirIfNeeded() {
	// do not use logger in this function because it's not initialized yet !
	const nexlHomeDir = NEXL_HOME_DIR;

	// is nexl home dir exists ?
	if (!fs.existsSync(nexlHomeDir)) {
		console.log('Creating [%s] nexl home directory', nexlHomeDir);
		fs.mkdirSync(nexlHomeDir);
		return;
	}

	// is nexl home dir is a real dir ?
	if (!fs.lstatSync(nexlHomeDir).isDirectory()) {
		throw util.format('The [%s] nexl home directory points to existing file. Recreate it as a directory or use another nexl home directory in the following way :\nnexl --nexl-home=/path/to/nexl/home/directory', nexlHomeDir);
	}
}

function initNexlHomeDir() {
	logger.log.debug('Creating default configuration files if absent in [%s] nexl home dir', NEXL_HOME_DIR);

	// creating tokens file is not exists
	if (!isConfFileExists(CONF_FILES.TOKENS)) {
		logger.log.info('The [%s] file doesn\'t exist in [%s] directory. Creating a new one and generating token for [%s] user', CONF_FILES.TOKENS, NEXL_HOME_DIR, utils.ADMIN_USERNAME);
		const token = security.generateToken();
		const tokens = {};
		tokens[utils.ADMIN_USERNAME] = token;
		save(tokens, CONF_FILES.TOKENS);
		logger.log.info('------> Use a token stored in [%s] file located in [%s] directory to register a [%s] account', CONF_FILES.TOKENS, NEXL_HOME_DIR, utils.ADMIN_USERNAME);
	}

	// creating admins file if not exists
	if (!isConfFileExists(CONF_FILES.ADMINS)) {
		logger.log.info('The [%s] file doesn\'t exist in [%s] directory. Creating a new one with a [%s] user', CONF_FILES.ADMINS, NEXL_HOME_DIR, utils.ADMIN_USERNAME);
		const admins = [utils.ADMIN_USERNAME];
		save(admins, CONF_FILES.ADMINS);
	}

	// creating permissions file if not exists
	if (!isConfFileExists(CONF_FILES.PERMISSIONS)) {
		logger.log.info('The [%s] file doesn\'t exist in [%s] directory. Creating a new one with a default permissions for [%s] user', CONF_FILES.PERMISSIONS, NEXL_HOME_DIR, utils.UNAUTHORIZED_USERNAME);
		const permission = {};
		permission[utils.UNAUTHORIZED_USERNAME] = {
			read: true,
			write: true
		};
		save(permission, CONF_FILES.PERMISSIONS);
	}
}


// --------------------------------------------------------------------------------
module.exports.CONF_FILES = CONF_FILES;
module.exports.SETTINGS = SETTINGS;

module.exports.load = load;
module.exports.save = save;

module.exports.NEXL_HOME_DIR = NEXL_HOME_DIR;
module.exports.AVAILABLE_ENCODINGS = AVAILABLE_ENCODINGS;
module.exports.createNexlHomeDirIfNeeded = createNexlHomeDirIfNeeded;
module.exports.initNexlHomeDir = initNexlHomeDir;
// --------------------------------------------------------------------------------
