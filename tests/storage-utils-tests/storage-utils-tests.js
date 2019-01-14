const assert = require('assert');

const testAPI = require('../test-api');
const confConsts = require('../../backend/common/conf-constants');
const confMgmt = require('../../backend/api/conf-mgmt');
const storageUtils = require('../../backend/api/storage-utils');
const di = require('../../backend/common/data-interchange-constants');

// --------------------------------------------------------------------------------

function init(predefinedNexlJSFIlesDir, tmpNexlJSFilesDir) {
	confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.STORAGE_DIR] = predefinedNexlJSFIlesDir;

	return Promise.resolve();
}

function run() {
	return storageUtils.gatherAllFiles('/').then(_ => {
		const data = {};
		data[di.RELATIVE_PATH] = '/';
		data[di.TEXT] = 'hello';
		data[di.MATCH_CASE] = false;
		data[di.IS_REGEX] = true;

		return storageUtils.findInFiles(data).then(result => {
			console.log(result);
			return Promise.resolve();
		});
	});
}

function done() {
	return Promise.resolve();
}

testAPI.startNexlApp(init, run, done);