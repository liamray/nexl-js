const testAPI = require('../tests-api');
const confConsts = require('../../backend/common/conf-constants');

const settings = {};
settings[confConsts.SETTINGS.JS_FILES_ROOT_DIR] = testAPI.createNexlJSFilesTmpDir();
settings[confConsts.SETTINGS.LOG_LEVEL] = 'error';
testAPI.createNexlHomeDir(settings);

// now can include nexl api
const confMgmt = require('../../backend/api/conf-mgmt');
const logger = require('../../backend/api/logger');
const security = require('../../backend/api/security');
const assert = require('assert');

confMgmt.init();

confMgmt.initSettings()
	.then(logger.init)
	.then(confMgmt.initUsers)
	.then(confMgmt.initPermissions)
	.then(confMgmt.initAdmins)
	.then(() => {
		test();
	});

function test() {
	let isAdmin = security.isAdmin('admin');
	console.log(isAdmin);
}