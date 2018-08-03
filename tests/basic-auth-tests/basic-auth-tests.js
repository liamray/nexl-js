const path = require('path');
const util = require('util');
const rp = require('request-promise');

const testAPINew = require('../test-api-new');
const confConsts = require('../../backend/common/conf-constants');
const securityConsts = require('../../backend/common/security-constants');
const confMgmt = require('../../backend/api/conf-mgmt');

const TEST_HOST = 'localhost';
const TEST_PORT = 8989;

// --------------------------------------------------------------------------------

function init(predefinedNexlJSFIlesDir, tmpNexlJSFilesDir) {
	const settings = confMgmt.getNexlSettingsCached();
	settings[confConsts.SETTINGS.HTTP_BINDING] = TEST_HOST;
	settings[confConsts.SETTINGS.HTTP_PORT] = TEST_PORT;
	settings[confConsts.SETTINGS.JS_FILES_ROOT_DIR] = predefinedNexlJSFIlesDir;

	return Promise.resolve();
}

function run() {
	const url = `http://${TEST_HOST}:${TEST_PORT}/general.js?expression=\${oneInch}`;

	// disabling read/write permissions for GUEST and AUTHENTICATED users
	confMgmt.getCached(confConsts.CONF_FILES.PERMISSIONS)[securityConsts.GUEST_USER].read = false;
	confMgmt.getCached(confConsts.CONF_FILES.PERMISSIONS)[securityConsts.GUEST_USER].write = false;
	confMgmt.getCached(confConsts.CONF_FILES.PERMISSIONS)[securityConsts.AUTHENTICATED].read = false;
	confMgmt.getCached(confConsts.CONF_FILES.PERMISSIONS)[securityConsts.AUTHENTICATED].write = false;

	// 1) with/without basic auth when GUEST/AUTHENTICATED user has read permission
	// 2) with/without basic auth when GUEST/AUTHENTICATED user doesn't have read permission
	// with : 1) wrong hash (gibrish) 2) proper hash but user doesn't exist 3) proper hash but user disabled 4) proper hash but password wrong 5) proper hash

	return rp(url)
		.then(result => {
			console.log(result);
			return Promise.resolve();
		});
}

function finalize() {
	return Promise.resolve();
}

testAPINew.startNexlApp(init, run, finalize);