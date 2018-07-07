const confConsts = require('../backend/common/conf-constants');
const fs = require('fs');
const path = require('path');
const os = require('os');

// --------------------------------------------------------------------------------

const DEFAULT_NEXL_TMP_DIR = path.join(os.tmpdir(), 'nexl');
const DEFAULT_NEXL_HOME_DIR = path.join(DEFAULT_NEXL_TMP_DIR, `.nexl-${Math.random()}`);
const DEFAULT_NEXL_JS_FILES_DIR = path.join(DEFAULT_NEXL_TMP_DIR, `nexl-js-files-${Math.random()}`);

const DEFAULT_SETTINGS = {};
DEFAULT_SETTINGS[confConsts.SETTINGS.JS_FILES_ROOT_DIR] = DEFAULT_NEXL_JS_FILES_DIR;
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
DEFAULT_SETTINGS[confConsts.SETTINGS.LOG_FILE_LOCATION] = path.join(DEFAULT_NEXL_HOME_DIR, 'nexl-tests.log');
DEFAULT_SETTINGS[confConsts.SETTINGS.LOG_LEVEL] = 'debug';
DEFAULT_SETTINGS[confConsts.SETTINGS.LOG_ROTATE_FILE_SIZE] = 9999;
DEFAULT_SETTINGS[confConsts.SETTINGS.LOG_ROTATE_FILES_COUNT] = 9999;

// --------------------------------------------------------------------------------

function createNexlHomeDir(nexlHomeDir, settings) {
	if (nexlHomeDir === undefined) {
		nexlHomeDir = DEFAULT_NEXL_HOME_DIR;
		if (!fs.existsSync(DEFAULT_NEXL_TMP_DIR)) {
			fs.mkdirSync(DEFAULT_NEXL_TMP_DIR);
		}
	}

	// creating dir...
	fs.mkdirSync(nexlHomeDir);

	// setting up arg
	process.argv.push(`--${confConsts.NEXL_HOME_DEF}=${nexlHomeDir}`);

	// creating settings file
	if (settings === undefined) {
		settings = DEFAULT_SETTINGS;
	}

	const jsFilesRootDir = settings[confConsts.SETTINGS.JS_FILES_ROOT_DIR];
	if (!fs.existsSync(jsFilesRootDir)) {
		fs.mkdirSync(jsFilesRootDir);
	}

	const settingsFile = path.join(jsFilesRootDir, confConsts.CONF_FILES.SETTINGS);
	if (!fs.existsSync(settingsFile)) {
		const fd = fs.openSync(settingsFile, 'w');
		fs.writeSync(fd, JSON.stringify({
			"version": "tests",
			"data": settings
		}, null, 2), 'UTF-8');
	}

	return nexlHomeDir;
}

function createRandomNexlJSFiles(dir) {

}

// --------------------------------------------------------------------------------
module.exports.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
module.exports.createNexlHomeDir = createNexlHomeDir;
// --------------------------------------------------------------------------------
