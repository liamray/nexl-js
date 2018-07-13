const assert = require('assert');

const testAPI = require('../tests-api');
const confConsts = require('../../backend/common/conf-constants');

const settings = {};
settings[confConsts.SETTINGS.LOG_LEVEL] = 'info';
testAPI.createNexlHomeDir(settings, null, [], null);

// now can include nexl api
const confMgmt = require('../../backend/api/conf-mgmt');
const logger = require('../../backend/api/logger');
const jsFilesUtils = require('../../backend/api/jsfiles-utils');

confMgmt.init();
confMgmt.reloadCache()
	.then(logger.init)
	.then(() => {
		test();
	});

function test() {
	jsFilesUtils.gatherAllFiles2()
		.then(item => {
			console.log(JSON.stringify(item, null, 2));
		})
		.catch(err => {
			console.log(err)
		});
}