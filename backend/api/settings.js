const osHomeDir = require('os-homedir');
const path = require('path');
const j79 = require('j79-utils');
const logger = require('./logger');

const confMgmt = require('./conf-mgmt');

// todo : bind all settings constants in one object

// available settings
const NEXL_SOURCES_DIR = 'nexl-sources-dir';
const NEXL_SOURCES_ENCODING = 'nexl-sources-encoding';
const HTTP_TIMEOUT = 'http-timeout';
const LDAP_URL = 'ldap-url';

const HTTP_BINDING = 'http-binding';
const HTTP_PORT = 'http-port';
const HTTPS_BINDING = 'https-binding';
const HTTPS_PORT = 'https-port';
const SSL_CERT_LOCATION = 'ssl-cert-location';
const SSL_KEY_LOCATION = 'ssl-key-location';

const LOG_FILE_LOCATION = 'log-file-location';
const LOG_LEVEL = 'log-level';
const LOG_ROTATE_FILE_SIZE = 'log-rotate-file-size-kb';
const LOG_ROTATE_FILES_COUNT = 'log-rotate-files-count';

const NEXL_CALLBACKS = 'nexl-callbacks';

// --------------------------------------------------------------------------------

// default values
const DEFAULT_VALUES = {};

// def value for nexl sources dire
DEFAULT_VALUES[NEXL_SOURCES_DIR] = function () {
	return path.join(osHomeDir(), 'nexl-sources');
};

// http binding and port
DEFAULT_VALUES[HTTP_BINDING] = 'localhost';
DEFAULT_VALUES[HTTP_PORT] = 3000;

// def value for nexl sources dire
DEFAULT_VALUES[LOG_FILE_LOCATION] = function () {
	return path.join(confMgmt.resolveNexlHomeDir(), 'nexl.log');
};

DEFAULT_VALUES[LOG_LEVEL] = 'info';
DEFAULT_VALUES[LOG_ROTATE_FILES_COUNT] = 999;
DEFAULT_VALUES[LOG_ROTATE_FILE_SIZE] = 0; // not rolling


// --------------------------------------------------------------------------------

// validations
const VALIDATORS = {};
const AVAILABLE_ENCODINGS = ['utf8', 'ascii'];

VALIDATORS[LOG_LEVEL] = function (key, val) {
	return logger.LEVELS.indexOf(val) >= 0;
};

VALIDATORS[NEXL_SOURCES_ENCODING] = function (key, val) {
	return AVAILABLE_ENCODINGS.indexOf(val) >= 0;
};

// --------------------------------------------------------------------------------

function isValid(key, val) {
	const validator = VALIDATORS[key];
	if (validator === undefined) {
		return true;
	}

	return validator(key, val);
}

function resolveDefaultValue(name) {
	const value = DEFAULT_VALUES[name];

	// doesn't have a default value
	if (!value) {
		return value;
	}

	// if the default value is a function, run it
	if (j79.isFunction(value)) {
		return value();
	}

	return value;
}

function get(name) {
	let value = confMgmt.load(confMgmt.CONF_FILES.SETTINGS)[name];

	if (value === undefined) {
		value = resolveDefaultValue(name);
		set(name, value);
	}

	return value;
}

function set(name, value) {
	const data = {};
	data[name] = value;
	confMgmt.save(data, confMgmt.CONF_FILES.SETTINGS);
}

// --------------------------------------------------------------------------------
module.exports.NEXL_SOURCES_DIR = NEXL_SOURCES_DIR;
module.exports.NEXL_SOURCES_ENCODING = NEXL_SOURCES_ENCODING;
module.exports.HTTP_TIMEOUT = HTTP_TIMEOUT;
module.exports.LDAP_URL = LDAP_URL;

module.exports.HTTP_BINDING = HTTP_BINDING;
module.exports.HTTP_PORT = HTTP_PORT;
module.exports.HTTPS_BINDING = HTTPS_BINDING;
module.exports.HTTPS_PORT = HTTPS_PORT;
module.exports.SSL_CERT_LOCATION = SSL_CERT_LOCATION;
module.exports.SSL_KEY_LOCATION = SSL_KEY_LOCATION;

module.exports.NEXL_CALLBACKS = NEXL_CALLBACKS;

module.exports.LOG_FILE_LOCATION = LOG_FILE_LOCATION;
module.exports.LOG_LEVEL = LOG_LEVEL;
module.exports.LOG_ROTATE_FILE_SIZE = LOG_ROTATE_FILE_SIZE;
module.exports.LOG_ROTATE_FILES_COUNT = LOG_ROTATE_FILES_COUNT;

module.exports.AVAILABLE_ENCODINGS = AVAILABLE_ENCODINGS;

module.exports.get = get;
module.exports.set = set;
module.exports.resolveDefaultValue = resolveDefaultValue;
module.exports.isValid = isValid;
// --------------------------------------------------------------------------------
