const confMgmt = require('./conf-mgmt');
const j79 = require('j79-utils');
const osHomeDir = require('os-homedir');
const path = require('path');

// available settings
const NEXL_SOURCES_DIR = 'nexl-sources-dir';
const NEXL_HTTP_PORT = 'http-port';

// default values
const DEFAULT_VALUES = {};

// def value for nexl sources dire
DEFAULT_VALUES[NEXL_SOURCES_DIR] = function () {
	return path.join(osHomeDir(), 'nexl-sources');
};

// default http port
DEFAULT_VALUES[NEXL_HTTP_PORT] = 3000;

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
	const value = confMgmt.load(confMgmt.CONF_FILES.SETTINGS)[name];
	return value ? value : resolveDefaultValue(name);
}

function set(name, value) {
	const data = {};
	data[name] = value;
	confMgmt.save(data, confMgmt.CONF_FILES.SETTINGS);
}

// --------------------------------------------------------------------------------
module.exports.NEXL_SOURCES_DIR = NEXL_SOURCES_DIR;
module.exports.NEXL_HTTP_PORT = NEXL_HTTP_PORT;
module.exports.get = get;
module.exports.set = set;
// --------------------------------------------------------------------------------
