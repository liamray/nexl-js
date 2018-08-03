const path = require('path');
const util = require('util');
const rp = require('request-promise');
const base64 = require('base-64');

const testAPI = require('../test-api');
const confConsts = require('../../backend/common/conf-constants');
const securityConsts = require('../../backend/common/security-constants');
const confMgmt = require('../../backend/api/conf-mgmt');

// --------------------------------------------------------------------------------

function init(predefinedNexlJSFIlesDir, tmpNexlJSFilesDir) {
	confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.JS_FILES_ROOT_DIR] = predefinedNexlJSFIlesDir;

	return Promise.resolve();
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
	confMgmt.getCached(confConsts.CONF_FILES.PERMISSIONS)[securityConsts.GUEST_USER].read = guestUser;
	confMgmt.getCached(confConsts.CONF_FILES.PERMISSIONS)[securityConsts.AUTHENTICATED].read = authenticatedUser;
	return Promise.resolve();
}

function run() {
	const request = {
		uri: `http://${testAPI.TEST_HOST}:${testAPI.TEST_PORT}/general.js?expression=\${oneInch}`,
		headers: {
			'Authorization': makeBasicAuth('test', '123456')
		}
	};

	// 1) with/without basic auth when GUEST/AUTHENTICATED user has read permission
	// 2) with/without basic auth when GUEST/AUTHENTICATED user doesn't have read permission
	// with : 1) wrong hash (gibrish) 2) proper hash but user doesn't exist 3) proper hash but user disabled 4) proper hash but password wrong 5) proper hash

	return Promise.resolve()
		.then(_ => setPermissions(false, false))
		.then(_ => testHttpRequest(request, 'dummy-base-64', true))
		.then(_ => testHttpRequest(request, makeBasicAuth('non-existing-user', '12345'), false))
		.then(_ => testHttpRequest(request, makeBasicAuth('disabled-user', 'wrong-password'), false))
		.then(_ => testHttpRequest(request, makeBasicAuth('disabled-user', '12345'), false))
		.then(_ => testHttpRequest(request, makeBasicAuth('test-user', 'wrong-password'), false))
		.then(_ => testHttpRequest(request, makeBasicAuth('test-user', '12345'), true))

		.then(_ => setPermissions(false, true))
		.then(_ => testHttpRequest(request, 'dkf3qpthsdkfgjh', false))
		.then(_ => testHttpRequest(request, makeBasicAuth('non-existing-user', '12345'), false))
		.then(_ => testHttpRequest(request, makeBasicAuth('disabled-user', 'wrong-password'), false))
		.then(_ => testHttpRequest(request, makeBasicAuth('disabled-user', '12345'), false))
		.then(_ => testHttpRequest(request, makeBasicAuth('test-user', 'wrong-password'), false))
		.then(_ => testHttpRequest(request, makeBasicAuth('test-user', '12345'), false))

		;
}

function finalize() {
	return Promise.resolve();
}

testAPI.startNexlApp(init, run, finalize);