const osHomeDir = require('os-homedir');
const path = require('path');
const j79 = require('j79-utils');

const confMgmt = require('./conf-mgmt');
const cmdLineArgs = require('./cmd-line-args');

// available settings
const NEXL_SOURCES_DIR = 'nexl-sources-dir';
const NEXL_HTTP_BINDING = 'http-binding';
const NEXL_HTTP_PORT = 'http-port';
const LOG_FILE = 'log-file';
const LOG_LEVEL = 'log-level';
const LOG_ROTATE_FILE_SIZE = 'log-rotate-file-size-kb';
const LOG_ROTATE_FILES_COUNT = 'log-rotate-files-count';

// --------------------------------------------------------------------------------

// default values
const DEFAULT_VALUES = {};

// def value for nexl sources dire
DEFAULT_VALUES[NEXL_SOURCES_DIR] = function () {
	return path.join(osHomeDir(), 'nexl-sources');
};

// http binding and port
DEFAULT_VALUES[NEXL_HTTP_BINDING] = 'localhost';
DEFAULT_VALUES[NEXL_HTTP_PORT] = 3000;

// def value for nexl sources dire
DEFAULT_VALUES[LOG_FILE] = function () {
	return path.join(confMgmt.resolveNexlHomeDir(), 'nexl.log');
};

DEFAULT_VALUES[LOG_LEVEL] = 'info';
DEFAULT_VALUES[LOG_ROTATE_FILES_COUNT] = 999;
DEFAULT_VALUES[LOG_ROTATE_FILE_SIZE] = 0; // not rolling

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

module.exports.NEXL_HTTP_BINDING = NEXL_HTTP_BINDING;
module.exports.NEXL_HTTP_PORT = NEXL_HTTP_PORT;

module.exports.LOG_FILE = LOG_FILE;
module.exports.LOG_LEVEL = LOG_LEVEL;
module.exports.LOG_ROTATE_FILE_SIZE = LOG_ROTATE_FILE_SIZE;
module.exports.LOG_ROTATE_FILES_COUNT = LOG_ROTATE_FILES_COUNT;

module.exports.get = get;
module.exports.set = set;
// --------------------------------------------------------------------------------
