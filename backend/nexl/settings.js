const j79 = require('j79-utils');
const osHomeDir = require('os-homedir');
const path = require('path');


var settings = {};
var defaultValues = {};

module.exports.NEXL_HOME_DIR = 'nexl-home-dir';

function resolveDefValue(key) {
	var value = defaultValues[key];

	if (j79.isString(value)) {
		return value;
	}

	if (j79.isFunction(value)) {
		return value();
	}

	throw 'No default value for [' + key + ']';
}

module.exports.set = function (key, value) {
	settings[key] = value;
};

module.exports.get = function (key) {
	var result = settings[key];
	if (result === undefined) {
		return resolveDefValue(key);
	} else {
		return result;
	}
};

module.exports.save = function () {

};

module.exports.load = function () {

};


defaultValues[module.exports.NEXL_HOME_DIR] = function () {
	return path.join(osHomeDir(), 'nexl-sources');
};
