const rp = require('request-promise');
const base64 = require('base-64');

const testAPI = require('../test-api');
const confConsts = require('../../backend/common/conf-constants');
const securityConsts = require('../../backend/common/security-constants');
const confMgmt = require('../../backend/api/conf-mgmt');
const security = require('../../backend/api/security');
const utils = require('../../backend/api/utils');

const TEST_USER = 'test-user';
const DISABLED_USER = 'disabled-user';
const NO_READ_PERMISSIONS_USER = 'no-read-permissions-user';
const PASSWORD = '123456';

// --------------------------------------------------------------------------------

function init(predefinedNexlJSFIlesDir, tmpNexlJSFilesDir) {
	const promises = [];

	// generate token, register
	confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.JS_FILES_ROOT_DIR] = predefinedNexlJSFIlesDir;

	const users = confMgmt.getCached(confConsts.CONF_FILES.USERS);

	users[TEST_USER] = {};
	users[TEST_USER].token2ResetPassword = utils.generateNewToken();

	users[DISABLED_USER] = {};
	users[DISABLED_USER].token2ResetPassword = utils.generateNewToken();
	users[DISABLED_USER].disabled = true;

	users[NO_READ_PERMISSIONS_USER] = {};
	users[NO_READ_PERMISSIONS_USER].token2ResetPassword = utils.generateNewToken();

	const permissions = confMgmt.getCached(confConsts.CONF_FILES.PERMISSIONS);
	permissions[TEST_USER] = {};
	permissions[TEST_USER].read = true;

	return confMgmt.save(users, confConsts.CONF_FILES.USERS)
		.then(confMgmt.save(permissions, confConsts.CONF_FILES.PERMISSIONS))
		.then(_ => security.resetPassword(TEST_USER, PASSWORD, users[TEST_USER].token2ResetPassword.token))
		.then(_ => security.resetPassword(DISABLED_USER, PASSWORD, users[DISABLED_USER].token2ResetPassword.token))
		.then(_ => security.resetPassword(NO_READ_PERMISSIONS_USER, PASSWORD, users[NO_READ_PERMISSIONS_USER].token2ResetPassword.token));
}

function decode(auth) {
	try {
		return base64.decode(auth.substr(6));
	} catch (e) {
		return auth;
	}
}

function testHttpRequest(request, auth, expectedResult) {
	let actualResult;

	request.headers = {
		'Authorization': auth
	};

	return rp(request)
		.then(data => {
			actualResult = true;
			return Promise.resolve();
		})
		.catch(err => {
			actualResult = false;
			return Promise.resolve();
		})
		.then(result => {
			if (actualResult === expectedResult) {
				return Promise.resolve();
			}

			const authDecoded = decode(auth);
			console.log(`Test failed for [${authDecoded}]`);
			printPermissions();
			return Promise.reject();
		});
}

function makeBasicAuth(username, password) {
	const auth = base64.encode(`${username}:${password}`);
	return `Basic ${auth}`;
}

function printPermissions() {
	const guestUser = confMgmt.getCached(confConsts.CONF_FILES.PERMISSIONS)[securityConsts.GUEST_USER].read;
	const authenticatedUser = confMgmt.getCached(confConsts.CONF_FILES.PERMISSIONS)[securityConsts.AUTHENTICATED].read;
	console.log(`Is guest user has read permission ? [${guestUser}]`);
	console.log(`Is authenticated user has read permission ? [${authenticatedUser}]`);
}

function setPermissions(guestUser, authenticatedUser) {
	const permissions = confMgmt.getCached(confConsts.CONF_FILES.PERMISSIONS);

	permissions[securityConsts.GUEST_USER].read = guestUser;
	permissions[securityConsts.AUTHENTICATED].read = authenticatedUser;

	return confMgmt.save(permissions, confConsts.CONF_FILES.PERMISSIONS);
}

function run() {
	const request = {
		uri: `http://${testAPI.TEST_HOST}:${testAPI.TEST_PORT}/general.js?expression=\${oneInch}`,
		headers: {
			'Authorization': makeBasicAuth('test', '123456')
		}
	};

	// disabled-user, test-user, no-read-permissions-user

	return Promise.resolve()
		.then(_ => setPermissions(false, false))
		.then(_ => testHttpRequest(request, undefined, false))
		.then(_ => testHttpRequest(request, 'dummy-base-64', false))
		.then(_ => testHttpRequest(request, makeBasicAuth('non-existing-user', PASSWORD), false))
		.then(_ => testHttpRequest(request, makeBasicAuth(DISABLED_USER, 'wrong-password'), false))
		.then(_ => testHttpRequest(request, makeBasicAuth(DISABLED_USER, PASSWORD), false))
		.then(_ => testHttpRequest(request, makeBasicAuth(NO_READ_PERMISSIONS_USER, 'wrong-password'), false))
		.then(_ => testHttpRequest(request, makeBasicAuth(NO_READ_PERMISSIONS_USER, PASSWORD), false))
		.then(_ => testHttpRequest(request, makeBasicAuth(TEST_USER, 'wrong-password'), false))
		.then(_ => testHttpRequest(request, makeBasicAuth(TEST_USER, PASSWORD), true))

		.then(_ => setPermissions(true, false))
		.then(_ => testHttpRequest(request, undefined, true))
		.then(_ => testHttpRequest(request, 'dummy-base-64', true))
		.then(_ => testHttpRequest(request, makeBasicAuth('non-existing-user', PASSWORD), true))
		.then(_ => testHttpRequest(request, makeBasicAuth(DISABLED_USER, 'wrong-password'), true))
		.then(_ => testHttpRequest(request, makeBasicAuth(DISABLED_USER, PASSWORD), true))
		.then(_ => testHttpRequest(request, makeBasicAuth(NO_READ_PERMISSIONS_USER, 'wrong-password'), true))
		.then(_ => testHttpRequest(request, makeBasicAuth(NO_READ_PERMISSIONS_USER, PASSWORD), true))
		.then(_ => testHttpRequest(request, makeBasicAuth(TEST_USER, 'wrong-password'), true))
		.then(_ => testHttpRequest(request, makeBasicAuth(TEST_USER, PASSWORD), true))

		.then(_ => setPermissions(false, true))
		.then(_ => testHttpRequest(request, undefined, false))
		.then(_ => testHttpRequest(request, 'dummy-base-64', false))
		.then(_ => testHttpRequest(request, makeBasicAuth('non-existing-user', PASSWORD), false))
		.then(_ => testHttpRequest(request, makeBasicAuth(DISABLED_USER, 'wrong-password'), false))
		.then(_ => testHttpRequest(request, makeBasicAuth(DISABLED_USER, PASSWORD), false))
		.then(_ => testHttpRequest(request, makeBasicAuth(NO_READ_PERMISSIONS_USER, 'wrong-password'), false))
		.then(_ => testHttpRequest(request, makeBasicAuth(NO_READ_PERMISSIONS_USER, PASSWORD), true))
		.then(_ => testHttpRequest(request, makeBasicAuth(TEST_USER, 'wrong-password'), false))
		.then(_ => testHttpRequest(request, makeBasicAuth(TEST_USER, PASSWORD), true))

		.then(_ => setPermissions(true, true))
		.then(_ => testHttpRequest(request, undefined, true))
		.then(_ => testHttpRequest(request, 'dummy-base-64', true))
		.then(_ => testHttpRequest(request, makeBasicAuth('non-existing-user', PASSWORD), true))
		.then(_ => testHttpRequest(request, makeBasicAuth(DISABLED_USER, 'wrong-password'), true))
		.then(_ => testHttpRequest(request, makeBasicAuth(DISABLED_USER, PASSWORD), true))
		.then(_ => testHttpRequest(request, makeBasicAuth(NO_READ_PERMISSIONS_USER, 'wrong-password'), true))
		.then(_ => testHttpRequest(request, makeBasicAuth(NO_READ_PERMISSIONS_USER, PASSWORD), true))
		.then(_ => testHttpRequest(request, makeBasicAuth(TEST_USER, 'wrong-password'), true))
		.then(_ => testHttpRequest(request, makeBasicAuth(TEST_USER, PASSWORD), true))

		;
}

function finalize() {
	return Promise.resolve();
}

testAPI.startNexlApp(init, run, finalize);