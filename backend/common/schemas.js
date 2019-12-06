const j79 = require('j79-utils');
const path = require('path');
const CronJob = require('cron').CronJob;

const confConsts = require('./conf-constants');
const securityConsts = require('../common/security-constants');
const uiConsts = require('./ui-constants');
const commonUtils = require('./common-utils');

const security = require('../api/security');
const logger = require('../api/logger');
const utils = require('../api/utils');
const confMgmt = require('../api/conf-mgmt');

const SETTINGS_FILE = confConsts.CONF_FILES.SETTINGS;

// --------------------------------------------------------------------------------
// default values
const DEF_VALUES = {};

// SETTINGS default values
DEF_VALUES[confConsts.CONF_FILES.SETTINGS] = {};
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.STORAGE_DIR] = () => path.join(confMgmt.getNexlHomeDir(), 'storage');
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.STORAGE_FILES_ENCODING] = confConsts.ENCODING_UTF8;
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.RAW_OUTPUT] = true;
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTP_TIMEOUT] = 120;
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.SESSION_TIMEOUT] = 60 * 24 * 7; // 1 week
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTP_BINDING] = 'localhost';
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTP_PORT] = 8080;
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTPS_BINDING] = 'localhost';
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTPS_PORT] = 443;
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LOG_FILE_LOCATION] = () => path.join(confMgmt.getNexlHomeDir(), 'logs');
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
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.BACKUP_STORAGE_CRON_EXPRESSION] = '';
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.BACKUP_STORAGE_DIR] = '';
DEF_VALUES[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.BACKUP_STORAGE_MAX_BACKUPS] = 0;

// WebHooks default values
DEF_VALUES[confConsts.CONF_FILES.WEBHOOKS] = [];

// USERS default values
DEF_VALUES[confConsts.CONF_FILES.USERS] = () => {
	logger.log.info('The [%s] file doesn\'t exist in [%s] directory. Creating a new one with a [%s] default user', confConsts.CONF_FILES.USERS, confMgmt.getNexlAppDataDir(), securityConsts.ADMIN_USER);

	// not exists, creating admin user and registration token
	const users = {};
	let token = utils.generateNewToken();
	users[securityConsts.ADMIN_USER] = {
		token2ResetPassword: token
	};

	logger.log.importantMessage('info', `Use the following token [${token.token}] to register [${securityConsts.ADMIN_USER}] account. This token is valid for [${security.TOKEN_VALID_HOURS}] hour(s). If token expires just delete the [${confConsts.CONF_FILES.USERS}] file located in [${confMgmt.getNexlAppDataDir()}] directory and restart nexl app`);
	return users;
};

// ADMINS default values
DEF_VALUES[confConsts.CONF_FILES.ADMINS] = () => {
	logger.log.info('The [%s] file doesn\'t exist in [%s] directory. Creating a new one with a [%s] default user', confConsts.CONF_FILES.ADMINS, confMgmt.getNexlAppDataDir(), securityConsts.ADMIN_USER);
	return [securityConsts.ADMIN_USER];
};

// PERMISSIONS default values
DEF_VALUES[confConsts.CONF_FILES.PERMISSIONS] = () => {
	logger.log.info('The [%s] file doesn\'t exist in [%s] directory. Creating a new one with read/write permissions for the following users : [%s, %s]', confConsts.CONF_FILES.PERMISSIONS, confMgmt.getNexlAppDataDir(), securityConsts.GUEST_USER, securityConsts.AUTHENTICATED);
	const permission = {};
	permission[securityConsts.GUEST_USER] = {
		read: true,
		write: true
	};
	permission[securityConsts.AUTHENTICATED] = {
		read: true,
		write: true
	};

	return permission;
};


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

function mandatoryString(val, msg) {
	return !j79.isString(val) || val.length < 1 ? invalid(`The [${msg}] must be a non empty string`) : valid();
}

function notMandatoryString(val, msg) {
	if (isNullOrEmpty(val)) {
		return valid();
	}

	return mandatoryString(val, msg);
}

function mandatoryInt(val, msg, min, max) {
	if (!j79.isNumber(val) || val.toString().indexOf('.') >= 0) {
		return invalid(`The [${msg}] must be a valid integer`);
	}

	if (min !== undefined && val < min) {
		return invalid(`The [${msg}] must be greater than or equal to [${min}]`);
	}

	if (max !== undefined && val > max) {
		return invalid(`The [${msg}] must be less than or equal to [${max}]`);
	}

	return valid();
}

function notMandatoryInt(val, msg, min, max) {
	if (isNullOrEmpty(val)) {
		return valid();
	}

	return mandatoryInt(val, msg, min, max);
}

function mandatoryBool(val, msg) {
	return j79.isBool(val) ? valid() : invalid(`The [${msg}] must be a valid boolean`);
}

function notMandatoryBool(val, msg) {
	if (isNullOrEmpty(val)) {
		return valid();
	}

	return mandatoryBool(val, msg);
}

function notMandatoryDate(val, msg) {
	if (isNullOrEmpty(val)) {
		return valid();
	}
	const parsed = Date.parse(val);
	// is NaN ?
	return parsed === parsed ? valid() : invalid(`The [${msg}] must be a valid date`);
}

// SETTINGS validations
SCHEMAS[confConsts.CONF_FILES.SETTINGS] = {};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.STORAGE_DIR] = (val) => mandatoryString(val, 'nexl storage home directory');
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.STORAGE_FILES_ENCODING] = (val) => {
	return confConsts.AVAILABLE_ENCODINGS.indexOf(val) >= 0 ? valid() : invalid('[nexl storage files encoding] must be one of the following : [' + confConsts.AVAILABLE_ENCODINGS.join(',') + ']');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTP_TIMEOUT] = (val) => mandatoryInt(val, 'HTTP timeout', 1);
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.SESSION_TIMEOUT] = (val) => mandatoryInt(val, 'Session timeout', 1);
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.RAW_OUTPUT] = (val) => mandatoryBool(val, 'Raw output');
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.JSONP] = (val) => notMandatoryString(val, 'JSONP');
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_URL] = (val) => {
	if (isNullOrEmpty(val)) {
		return valid();
	}

	if (!j79.isString(val)) {
		return invalid('[LDAP URL] must a valid string');
	}

	return val.indexOf('ldap://') === 0 && val.match(/[0-9]$/) !== null ? valid() : invalid('[LDAP URL] must be started with [ldap://] and ended with a port number');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_BASE_DN] = (val) => notMandatoryString(val, 'Base DN');
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_BIND_DN] = (val) => notMandatoryString(val, '[Bind DN');
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_BIND_PASSWORD] = (val) => notMandatoryString(val, 'LDAP password');
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LDAP_FIND_BY] = (val) => notMandatoryString(val, 'LDAP find by');
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTP_BINDING] = (val) => notMandatoryString(val, 'HTTP binding');
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTP_PORT] = (val) => notMandatoryInt(val, 'HTTP port', 1, 65535);
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTPS_BINDING] = (val) => notMandatoryString(val, 'HTTPS binding');
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.HTTPS_PORT] = (val) => notMandatoryInt(val, 'HTTPS port', 1, 65535);
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.SSL_CERT_LOCATION] = (val) => notMandatoryString(val, 'SSL cert location');
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.SSL_KEY_LOCATION] = (val) => notMandatoryString(val, 'SSL key location');
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.SSL_CA_LOCATION] = (val) => notMandatoryString(val, 'SSL CA location');
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LOG_FILE_LOCATION] = (val) => mandatoryString(val, 'log file location');
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LOG_LEVEL] = (val) => {
	return logger.getAvailLevels().indexOf(val) >= 0 ? valid() : invalid('[Log level] must be of the following : [' + logger.getAvailLevels().join(',') + ']');
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LOG_ROTATE_FILE_SIZE] = (val) => mandatoryInt(val, 'log rotate file size', 0);
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.LOG_ROTATE_FILES_COUNT] = (val) => mandatoryInt(val, 'Log rotate files count', 0);

SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.BACKUP_STORAGE_CRON_EXPRESSION] = (val) => {
	if (isNullOrEmpty(val)) {
		return valid();
	}

	try {
		new CronJob(val);
	} catch (e) {
		return invalid('Bad cron expression');
	}

	return valid();
};
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.BACKUP_STORAGE_DIR] = (val) => notMandatoryString(val, 'Backup storage directory');
SCHEMAS[confConsts.CONF_FILES.SETTINGS][confConsts.SETTINGS.BACKUP_STORAGE_MAX_BACKUPS] = (val) => mandatoryInt(val, 'Max storage backups count', 0);

// --------------------------------------------------------------------------------
// WEBHOOKS validations
SCHEMAS[confConsts.CONF_FILES.WEBHOOKS] = [{
	id: (val) => mandatoryInt(val, '[id] is a mandatory'),
	relativePath: (val) => mandatoryString(val, '[relativePath] is a mandatory'),
	url: (val) => {
		if (!j79.isString(val)) {
			return invalid('[url] must be a string');
		}

		if (!val.match(/^https?:\/\/.*/)) {
			return invalid('Invalid [url]');
		}

		return valid();
	},
	secret: valid,
	isDisabled: (val) => mandatoryBool(val, '[isDisabled] is a mandatory')
}];

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

			return commonUtils.validatePasswordStrength(val) ? valid() : invalid(uiConsts.BAD_PASSWORD_MSG);
		},

		disabled: (val) => notMandatoryBool(val, 'disabled'),

		token2ResetPassword: (val) => {
			if (val === undefined || val === null) {
				return valid();
			}

			return notMandatoryString(val.token, 'token2ResetPassword => token') && notMandatoryDate(val.created, '[token2ResetPassword] => [created]');
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
		read: (val) => mandatoryBool(val, 'permissions => read'),
		write: (val) => mandatoryBool(val, 'permissions => write'),
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
	return hasHttpConnector(data) || hasHttpsConnector(data) ? valid() : invalid('You have to provide either HTTP or HTTPS binding details');
};
GROUP_VALIDATIONS[SETTINGS_FILE][confConsts.SETTINGS_GROUP.LDAP] = (data) => {
	const ldapUrl = data[confConsts.SETTINGS.LDAP_URL];
	const baseDN = data[confConsts.SETTINGS.LDAP_BASE_DN];

	if (isNullOrEmpty(ldapUrl) && !isNullOrEmpty(baseDN)) {
		return invalid('You have to provide an LDAP URL');
	}

	if (!isNullOrEmpty(ldapUrl) && isNullOrEmpty(baseDN)) {
		return invalid('You have to provide an LDAP Base DN');
	}

	return valid();
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
