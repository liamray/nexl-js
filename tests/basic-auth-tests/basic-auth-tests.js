const path = require('path');
const util = require('util');
const rp = require('request-promise');

const testAPINew = require('../test-api-new');
const confConsts = require('../../backend/common/conf-constants');
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