const path = require('path');
const util = require('util');
const rp = require('request-promise');
const assert = require('assert');

const testAPINew = require('../test-api-new');
const confConsts = require('../../backend/common/conf-constants');
const confMgmt = require('../../backend/api/conf-mgmt');
const logger = require('../../backend/api/logger');
const jsFilesUtils = require('../../backend/api/jsfiles-utils');
const securityConsts = require('../../backend/common/security-constants');

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
	return jsFilesUtils.gatherAllFiles()
		.then(item => {
			console.log(JSON.stringify(item, null, 2));
		});
}

function finalize() {
	return Promise.resolve();
}

testAPINew.startNexlApp(init, run, finalize);