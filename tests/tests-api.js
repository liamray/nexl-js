const confConsts = require('../backend/common/conf-constants');
const fs = require('fs');
const path = require('path');
const os = require('os');
const deepMerge = require('deepmerge');
const fsextra = require('fs-extra');


// --------------------------------------------------------------------------------

const TMP_DIR_ROOT = path.join(os.tmpdir(), 'nexl');

const NEXL_HOME_DIR = path.join(TMP_DIR_ROOT, '.nexl');
const NEXL_JS_FILES_DIR = path.join(__dirname, 'nexl-js-files-4-tests');

const DEFAULT_SETTINGS = {};
DEFAULT_SETTINGS[confConsts.SETTINGS.JS_FILES_ROOT_DIR] = NEXL_JS_FILES_DIR;
DEFAULT_SETTINGS[confConsts.SETTINGS.JS_FILES_ENCODING] = 'UTF-8';
DEFAULT_SETTINGS[confConsts.SETTINGS.HTTP_TIMEOUT] = 10;
DEFAULT_SETTINGS[confConsts.SETTINGS.LDAP_URL] = undefined;
DEFAULT_SETTINGS[confConsts.SETTINGS.LDAP_BASE_DN] = undefined;
DEFAULT_SETTINGS[confConsts.SETTINGS.LDAP_BIND_DN] = undefined;
DEFAULT_SETTINGS[confConsts.SETTINGS.LDAP_BIND_PASSWORD] = undefined;
DEFAULT_SETTINGS[confConsts.SETTINGS.LDAP_FIND_BY] = undefined;
DEFAULT_SETTINGS[confConsts.SETTINGS.HTTP_BINDING] = 'localhost';
DEFAULT_SETTINGS[confConsts.SETTINGS.HTTP_PORT] = 8181;
DEFAULT_SETTINGS[confConsts.SETTINGS.HTTPS_BINDING] = undefined;
DEFAULT_SETTINGS[confConsts.SETTINGS.HTTPS_PORT] = undefined;
DEFAULT_SETTINGS[confConsts.SETTINGS.SSL_CERT_LOCATION] = undefined;
DEFAULT_SETTINGS[confConsts.SETTINGS.SSL_KEY_LOCATION] = undefined;
DEFAULT_SETTINGS[confConsts.SETTINGS.LOG_FILE_LOCATION] = path.join(NEXL_HOME_DIR, 'nexl-tests.log');
DEFAULT_SETTINGS[confConsts.SETTINGS.LOG_LEVEL] = 'debug';
DEFAULT_SETTINGS[confConsts.SETTINGS.LOG_ROTATE_FILE_SIZE] = 9999;
DEFAULT_SETTINGS[confConsts.SETTINGS.LOG_ROTATE_FILES_COUNT] = 9999;

// --------------------------------------------------------------------------------

function createNexlHomeDir(settings) {
	// creating TMP_ROOT_DIR if doesn't exist
	if (!fs.existsSync(TMP_DIR_ROOT)) {
		fs.mkdirSync(TMP_DIR_ROOT);
	}

	// deleting NEXL_HOME_DIR
	if (fs.existsSync(NEXL_HOME_DIR)) {
		fsextra.removeSync(NEXL_HOME_DIR);
	}

	// recreating NEXL_HOME_DIR
	fs.mkdirSync(NEXL_HOME_DIR);


	// pointing to NEXL_HOME_DIR
	process.argv.push(`--${confConsts.NEXL_HOME_DEF}=${NEXL_HOME_DIR}`);

	const finalSettings = deepMerge(DEFAULT_SETTINGS, settings || {});

	const settingsFile = path.join(NEXL_HOME_DIR, confConsts.CONF_FILES.SETTINGS);
	const fd = fs.openSync(settingsFile, 'w');
	fs.writeSync(fd, JSON.stringify({
		"version": "tests",
		"data": finalSettings
	}, null, 2), 'UTF-8');
}

function createNexlJSFilesTmpDir() {
	const nexlJSFilesDir = path.join(TMP_DIR_ROOT, 'nexl-js-files-4-tests');

	// creating TMP_ROOT_DIR if doesn't exist
	if (!fs.existsSync(TMP_DIR_ROOT)) {
		fs.mkdirSync(TMP_DIR_ROOT);
	}

	if (fs.existsSync(nexlJSFilesDir)) {
		fsextra.removeSync(nexlJSFilesDir);
	}

	fs.mkdirSync(nexlJSFilesDir);

	return nexlJSFilesDir;
}

// --------------------------------------------------------------------------------
module.exports.createNexlHomeDir = createNexlHomeDir;
module.exports.createNexlJSFilesTmpDir = createNexlJSFilesTmpDir;
// --------------------------------------------------------------------------------
