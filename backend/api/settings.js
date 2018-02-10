const osHomeDir = require('os-homedir');
const path = require('path');
const j79 = require('j79-utils');

const confMgmt = require('./conf-mgmt');
const cmdLineArgs = require('./cmd-line-args');

// available settings
const NEXL_SOURCES_DIR = 'nexl-sources-dir';
const NEXL_HTTP_PORT = 'http-port';
const LOG_FILE = 'log-file';
const LOG_LEVEL = 'log-level';
const MAX_LOG_FILES = 'max-log-files';
const LOG_ROLLING_SIZE_KB = 'log-rolling-size-kb';

// --------------------------------------------------------------------------------

// default values
const DEFAULT_VALUES = {};

// def value for nexl sources dire
DEFAULT_VALUES[NEXL_SOURCES_DIR] = function () {
	return path.join(osHomeDir(), 'nexl-sources');
};

// default http port
DEFAULT_VALUES[NEXL_HTTP_PORT] = 3000;

// def value for nexl sources dire
DEFAULT_VALUES[LOG_FILE] = function () {
	return path.join(confMgmt.resolveNexlHomeDir(), 'nexl.log');
};

DEFAULT_VALUES[LOG_LEVEL] = 'info';
DEFAULT_VALUES[MAX_LOG_FILES] = 999;
DEFAULT_VALUES[LOG_ROLLING_SIZE_KB] = 0; // not rolling

// --------------------------------------------------------------------------------

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

	if (!value) {
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
module.exports.NEXL_HTTP_PORT = NEXL_HTTP_PORT;

module.exports.LOG_FILE = LOG_FILE;
module.exports.LOG_LEVEL = LOG_LEVEL;
module.exports.MAX_LOG_FILES = MAX_LOG_FILES;
module.exports.LOG_ROLLING_SIZE_KB = LOG_ROLLING_SIZE_KB;

module.exports.get = get;
module.exports.set = set;
// --------------------------------------------------------------------------------
