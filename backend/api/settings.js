const confMgmt = require('./conf-mgmt');
const j79 = require('j79-utils');
const osHomeDir = require('os-homedir');
const path = require('path');


const SETTINGS_FILE = 'settings.js';

// available settings
const NEXL_SOURCES_DIR = 'nexl-sources-dir';

// default values
const DEFAULT_VALUES = {};
DEFAULT_VALUES[NEXL_SOURCES_DIR] = function () {
	return path.join(osHomeDir(), 'nexl-sources');
};

function resolveDefaultValue(name) {
	var value = DEFAULT_VALUES[name];

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
	var value = confMgmt.load(SETTINGS_FILE)[name];
	return value ? value : resolveDefaultValue(name);
}

function set(name, value) {
	var data = {};
	data[name] = value;
	confMgmt.save(data, SETTINGS_FILE);
}

// --------------------------------------------------------------------------------
module.exports.NEXL_SOURCES_DIR = NEXL_SOURCES_DIR;
module.exports.get = get;
module.exports.set = set;
// --------------------------------------------------------------------------------
