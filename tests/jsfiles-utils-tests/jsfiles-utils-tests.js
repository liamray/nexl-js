const path = require('path');
const util = require('util');
const rp = require('request-promise');
const assert = require('assert');

const testAPI = require('../test-api');
const confConsts = require('../../backend/common/conf-constants');
const confMgmt = require('../../backend/api/conf-mgmt');
const jsFilesUtils = require('../../backend/api/jsfiles-utils');

// --------------------------------------------------------------------------------

function init(predefinedNexlJSFIlesDir, tmpNexlJSFilesDir) {
	confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.JS_FILES_ROOT_DIR] = predefinedNexlJSFIlesDir;

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

testAPI.startNexlApp(init, run, finalize);