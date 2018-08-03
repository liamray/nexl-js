const assert = require('assert');

const testAPINew = require('../test-api-new');
const confConsts = require('../../backend/common/conf-constants');
const confMgmt = require('../../backend/api/conf-mgmt');
const security = require('../../backend/api/security');
const securityConsts = require('../../backend/common/security-constants');

const TEST_HOST = 'localhost';
const TEST_PORT = 8989;

// --------------------------------------------------------------------------------

function init(predefinedNexlJSFIlesDir, tmpNexlJSFilesDir) {
	const settings = confMgmt.getNexlSettingsCached();
	settings[confConsts.SETTINGS.HTTP_BINDING] = TEST_HOST;
	settings[confConsts.SETTINGS.HTTP_PORT] = TEST_PORT;
	settings[confConsts.SETTINGS.JS_FILES_ROOT_DIR] = tmpNexlJSFilesDir;

	return Promise.resolve();
}

function run() {
	if (security.isAdmin(securityConsts.ADMIN_USER)) {
		return Promise.resolve();
	} else {
		return Promise.reject();
	}
}

function finalize() {
	return Promise.resolve();
}

testAPINew.startNexlApp(init, run, finalize);