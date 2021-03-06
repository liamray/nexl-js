const path = require('path');
const util = require('util');
const rp = require('request-promise');
const assert = require('assert');

const testAPI = require('../test-api');
const confConsts = require('../../backend/common/conf-constants');
const confMgmt = require('../../backend/api/conf-mgmt');
const storageUtils = require('../../backend/api/storage-utils');

// --------------------------------------------------------------------------------

function init(predefinedNexlJSFIlesDir, tmpNexlJSFilesDir) {
	confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.STORAGE_DIR] = predefinedNexlJSFIlesDir;

	return Promise.resolve();
}

function run() {
	return storageUtils.gatherAllFiles()
		.then(item => {
			console.log(JSON.stringify(item, null, 2));
		});
}

function done() {
	return Promise.resolve();
}

testAPI.startNexlApp(init, run, done);