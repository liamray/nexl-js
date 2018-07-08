const assert = require('assert');

const testAPI = require('../tests-api');
const confConsts = require('../../backend/common/conf-constants');

const settings = {};
settings[confConsts.SETTINGS.JS_FILES_ROOT_DIR] = testAPI.createNexlJSFilesTmpDir();
settings[confConsts.SETTINGS.LOG_LEVEL] = 'error';
testAPI.createNexlHomeDir(settings, null, [], null);

// now can include nexl api
const confMgmt = require('../../backend/api/conf-mgmt');
const logger = require('../../backend/api/logger');
const security = require('../../backend/api/security');

confMgmt.init();
confMgmt.reloadCache()
	.then(logger.init)
	.then(() => {
		test();
	});

function test() {
	assert(!security.isAdmin('admin'));

	confMgmt.save(['admin'], confConsts.CONF_FILES.ADMINS)
		.then(() => {
			assert(security.isAdmin('admin'));
		});
}