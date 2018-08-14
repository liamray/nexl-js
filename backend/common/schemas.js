const j79 = require('j79-utils');
const path = require('path');
const osHomeDir = require('os-homedir');

const logger = require('../api/logger');
const confConsts = require('./conf-constants');
const confMgmt = require('../api/conf-mgmt');
const commonUtils = require('../common/common-utils');

const SETTINGS_FILE = confConsts.CONF_FILES.SETTINGS;

// --------------------------------------------------------------------------------
// default values
const DEF_VALUES = {};

// SETTINGS default values
DEF_VALUES[confConsts.CONF_FILES.SETTINGS] = {};
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.JS_FILES_ROOT_DIR] = () => path.join(osHomeDir(), 'nexl-js-files');
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.JS_FILES_ENCODING] = confConsts.ENCODING_UTF8;
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.RAW_OUTPUT] = false;
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTP_TIMEOUT] = 120;
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.SESSION_TIMEOUT] = 60 * 24 * 7; // 1 week
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTP_BINDING] = 'localhost';
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTP_PORT] = 8080;
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTPS_BINDING] = 'localhost';
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTPS_PORT] = 443;
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LOG_FILE_LOCATION] = () => path.join(confMgmt.getNexlHomeDir(), 'nexl.log');
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LOG_LEVEL] = 'info';
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LOG_ROTATE_FILES_COUNT] = 999;
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LOG_ROTATE_FILE_SIZE] = 0; // not rotating
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_URL] = '';
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_BASE_DN] = '';
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_BIND_DN] = '';
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_BIND_PASSWORD] = '';
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_FIND_BY] = '';
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.SSL_CERT_LOCATION] = '';
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.SSL_KEY_LOCATION] = '';
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.SSL_CA_LOCATION] = '';

// PASSWORDS default values
DEF_VALUES[confConsts.CONF_FILES.USERS] = {};

// ADMINS default values
DEF_VALUES[confConsts.CONF_FILES.ADMINS] = [];

// PERMISSIONS default values
DEF_VALUES[confConsts.CONF_FILES.PERMISSIONS] = {};


// --------------------------------------------------------------------------------
// validation schemas
const SCHEMAS = {};

// --------------------------------------------------------------------------------
function valid() {
	return {
		isValid: true
	}
}

function invalid(err) {
	return {
		isValid: false,
		err: err
	}
}

function isNullOrEmpty(val) {
	return val === null || val === undefined || val === '';
}

// SETTINGS validations
SCHEMAS[confConsts.CONF_FILES.SETTINGS] = {};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.JS_FILES_ROOT_DIR] = (val) => {
	if (j79.isString(val) && val.length > 0) {
		return valid();
	}

	return invalid('[nexl storage home directory] must be non empty string');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.JS_FILES_ENCODING] = (val) => {
	return confConsts.AVAILABLE_ENCODINGS.indexOf(val) >= 0 ? valid() : invalid('[nexl storge files encoding] must be one of the following : [' + confConsts.AVAILABLE_ENCODINGS.join(',') + ']');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTP_TIMEOUT] = (val) => {
	if (!j79.isNumber(val) || val.toString().indexOf('.') >= 0) {
		return invalid('[HTTP timeout] must be a positive integer');
	}

	if (val < 1) {
		return invalid('[HTTP timeout] must be greater than 0');
	}

	return valid();
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.SESSION_TIMEOUT] = (val) => {
	if (!j79.isNumber(val) || val.toString().indexOf('.') >= 0) {
		return invalid('[Session timeout] must be a positive integer');
	}

	if (val < 1) {
		return invalid('[Session timeout] must be greater than 0');
	}

	return valid();
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.RAW_OUTPUT] = (val) => {
	if (!j79.isBool(val)) {
		return invalid('[Raw output] must be a valid boolean value');
	}

	return valid();
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.JSONP] = (val) => {
	if (j79.isString(val) || val === undefined || val === null) {
		return valid();
	}

	return invalid('[JSONP] must be a valid string');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_URL] = (val) => {
	if (isNullOrEmpty(val)) {
		return valid();
	}

	if (!j79.isString(val)) {
		return invalid('[LDAP URL] must a valid string');
	}

	return val.indexOf('ldap://') === 0 ? valid() : invalid('[LDAP URL] must be started with ldap://');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_BASE_DN] = (val) => {
	if (isNullOrEmpty(val)) {
		return valid();
	}
	return j79.isString(val) ? valid() : invalid('[Base DN] must a valid string');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_BIND_DN] = (val) => {
	if (isNullOrEmpty(val)) {
		return valid();
	}
	return j79.isString(val) ? valid() : invalid('[Bind DN] must a valid string');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_BIND_PASSWORD] = (val) => {
	if (isNullOrEmpty(val)) {
		return valid();
	}
	return j79.isString(val) ? valid() : invalid('[LDAP password] must a valid string');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_FIND_BY] = (val) => {
	if (isNullOrEmpty(val)) {
		return valid();
	}
	return j79.isString(val) ? valid() : invalid('[LDAP find by] must a valid string');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTP_BINDING] = (val) => {
	if (isNullOrEmpty(val)) {
		return valid();
	}
	return j79.isString(val) ? valid() : invalid('[HTTP binding] must a valid string');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTP_PORT] = (val) => {
	if (isNullOrEmpty(val)) {
		return valid();
	}

	if (!j79.isNumber(val) || val.toString().indexOf('.') >= 0) {
		return invalid('[HTTP port] must be a valid integer');
	}

	if (val < 1 || val > 65535) {
		return invalid('[HTTP port] must be greater than 0 and less than 65536');
	}

	return valid();
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTPS_BINDING] = (val) => {
	if (isNullOrEmpty(val)) {
		return valid();
	}
	return j79.isString(val) ? valid() : invalid('[HTTPS binding] must a valid string');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTPS_PORT] = (val) => {
	if (isNullOrEmpty(val)) {
		return valid();
	}

	if (!j79.isNumber(val) || val.toString().indexOf('.') >= 0) {
		return invalid('[HTTPS port] must be a valid integer');
	}

	if (val < 1 || val > 65535) {
		return invalid('[HTTPS port] must be greater than 0 and less than 65536');
	}

	return valid();
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.SSL_CERT_LOCATION] = (val) => {
	if (isNullOrEmpty(val)) {
		return valid();
	}
	return j79.isString(val) ? valid() : invalid('[SSL cert location] must a valid string');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.SSL_KEY_LOCATION] = (val) => {
	if (isNullOrEmpty(val)) {
		return valid();
	}
	return j79.isString(val) ? valid() : invalid('[SSL key location] must a valid string');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.SSL_CA_LOCATION] = (val) => {
	if (isNullOrEmpty(val)) {
		return valid();
	}
	return j79.isString(val) ? valid() : invalid('[SSL CA location] must a valid string');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LOG_FILE_LOCATION] = (val) => {
	if (j79.isString(val) && val.length > 0) {
		return valid();
	}

	return invalid('[log file location] must be non empty string');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LOG_LEVEL] = (val) => {
	return logger.getAvailLevels().indexOf(val) >= 0 ? valid() : invalid('[Log level] must be of the following : [' + logger.getAvailLevels().join(',') + ']');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LOG_ROTATE_FILE_SIZE] = (val) => {
	if (!j79.isNumber(val) || val.toString().indexOf('.') >= 0) {
		return invalid('[Log rotate file size] must be a valid integer');
	}

	return val >= 0 ? valid() : invalid('[Log rotate file size] must be a positive integer');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LOG_ROTATE_FILES_COUNT] = (val) => {
	if (!j79.isNumber(val) || val.toString().indexOf('.') >= 0) {
		return invalid('[Log rotate files count] must be a valid integer');
	}

	return val >= 0 ? valid() : invalid('[Log rotate files count] must be a positive integer');
};

// --------------------------------------------------------------------------------
// USERS validations
SCHEMAS[confConsts.CONF_FILES.USERS] = {
	'*': {
		password: (val) => {
			if (isNullOrEmpty(val)) {
				return valid();
			}

			if (!j79.isString(val)) {
				return invalid('Password must be a valid string');
			}

			return commonUtils.validatePasswordStrength(val) ? valid() : invalid('Password must contain at least one [A-z] character, one number character and must be at least 5 characters');
		},

		disabled: (val) => {
			if (val === undefined || val === null) {
				return valid();
			}
			return j79.isBool(val) ? valid() : invalid('[disabled] field must be of a boolean type');
		},

		token2ResetPassword: {
			token: (val) => {
				if (isNullOrEmpty(val)) {
					return valid();
				}
				return j79.isString(val) && val.length > 1 ? valid() : invalid('[token2ResetPassword] => [token] must be a valid non empty string');
			},
			created: (val) => {
				if (isNullOrEmpty(val)) {
					return valid();
				}
				const parsed = Date.parse(val);
				// is NaN ?
				return parsed === parsed ? valid() : invalid('[token2ResetPassword] => [created] field must be a valid date string');
			}
		},
	}
};


// --------------------------------------------------------------------------------
// ADMINS validations
SCHEMAS[confConsts.CONF_FILES.ADMINS] = [
	(val) => {
		if (!j79.isString(val)) {
			return invalid('[admins] => [username] must be a valid string');
		}

		return commonUtils.validateUsernameStrength(val) ? valid() : invalid('[admins] => [username] must contain at least three [A-z0-9] characters and might contain hyphen and underscore characters');
	}
];


// --------------------------------------------------------------------------------
// PERMISSIONS validations
SCHEMAS[confConsts.CONF_FILES.PERMISSIONS] = {
	'*': {
		read: (val) => {
			return j79.isBool(val) ? valid() : invalid('[permissions] => [read] items must of a boolean type');
		},
		write: (val) => {
			return j79.isBool(val) ? valid() : invalid('[permissions] => [write] items must of a boolean type');
		}
	}
};


// --------------------------------------------------------------------------------
const GROUP_VALIDATIONS = {};

function hasHttpConnector(data) {
	return !isNullOrEmpty(data[confConsts.SETTINGS.HTTP_BINDING]) && !isNullOrEmpty(data[confConsts.SETTINGS.HTTP_PORT]);
}

function hasHttpsConnector(data) {
	return !isNullOrEmpty(data[confConsts.SETTINGS.HTTPS_BINDING]) && !isNullOrEmpty(data[confConsts.SETTINGS.HTTPS_PORT]) && !isNullOrEmpty(data[confConsts.SETTINGS.SSL_KEY_LOCATION]) && !isNullOrEmpty(data[confConsts.SETTINGS.SSL_CERT_LOCATION]);
}

GROUP_VALIDATIONS[SETTINGS_FILE] = {};
GROUP_VALIDATIONS[SETTINGS_FILE][confConsts.SETTINGS_GROUP.CONNECTORS] = (data) => {
	return hasHttpConnector(data) || hasHttpsConnector(data) ? valid() : invalid('You have to provide either HTTP or HTTPS connector details');
};
GROUP_VALIDATIONS[SETTINGS_FILE][confConsts.SETTINGS_GROUP.LDAP] = (data) => {
	return !isNullOrEmpty(data[confConsts.SETTINGS.LDAP_URL]) && !isNullOrEmpty(data[confConsts.SETTINGS.LDAP_BASE_DN]) ? valid() : invalid('You have to provide at least LDAP URL and Base DN');
};

// --------------------------------------------------------------------------------
module.exports.DEF_VALUES = DEF_VALUES;
module.exports.SCHEMAS = SCHEMAS;
module.exports.GROUP_VALIDATIONS = GROUP_VALIDATIONS;
module.exports.valid = valid;
module.exports.invalid = invalid;
module.exports.hasHttpConnector = hasHttpConnector;
module.exports.hasHttpsConnector = hasHttpsConnector;
// --------------------------------------------------------------------------------
