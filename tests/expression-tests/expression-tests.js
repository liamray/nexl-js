// todo : test \n and \t args

const http = require('http');
const path = require('path');
const util = require('util');
const queryString = require('querystring');

const testAPI = require('../tests-api');
const confConsts = require('../../backend/common/conf-constants');

const TEST_HOST = 'localhost';
const TEST_PORT = 8989;

const settings = {};
settings[confConsts.SETTINGS.JS_FILES_ROOT_DIR] = path.join(__dirname, '../nexl-js-files-4-tests');
settings[confConsts.SETTINGS.LOG_LEVEL] = 'info';
settings[confConsts.SETTINGS.HTTP_BINDING] = TEST_HOST;
settings[confConsts.SETTINGS.HTTP_PORT] = TEST_PORT;

testAPI.createNexlHomeDir(settings);

// now can include nexl api
const confMgmt = require('../../backend/api/conf-mgmt');
const logger = require('../../backend/api/logger');
const testCases = require('./test-cases.js');
const NexlApp = require('../../backend/nexl-app/nexl-app');

let NEXL_APP;

start()
	.then(
		_ => {
			logger.log.importantMessage('info', 'ALL Tests are PASSED !!!');
			NEXL_APP.stop();
		}).catch(
	(err) => {
		logger.log.importantMessage('error', 'Tests are failed !');
		logger.log.importantMessage('error', err);
		NEXL_APP.stop();
	});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function testCaseInner(options, testCase) {
	return new Promise((resolve, reject) => {
		logger.log.info('Method : [%s], path : [%s]', options.method, options.path);
		const req = http.request(options, function (res) {
			res.setEncoding('utf8');
			let data = '';
			res.on('data', function (chunk) {
				data += chunk;
			});
			res.on('end', function () {
				const testCaseAsString = util.format('source=%s, args=%s', testCase.request.source, JSON.stringify(testCase.request.args));

				if (res.statusCode !== testCase.result.expectedStatusCode) {
					reject(util.format('TEST FAILED !!! Method is [%s]. Expected [%s] http status doesn\'t match to received [%s]\nmsg = %s\n%s', options.method, testCase.result.expectedStatusCode, res.statusCode, data, testCaseAsString));
					return;
				}

				const contentType = res.headers["content-type"];
				if (contentType !== testCase.result.expectedHeader) {
					reject(util.format('TEST FAILED !!! Method is [%s]. Expected [%s] header doesn\'t match to received [%s]\n%s', options.method, testCase.result.expectedHeader, contentType, testCaseAsString));
					return;
				}

				if (res.statusCode > 299 || res.statusCode < 200) {
					data = res.statusMessage;
				}

				if (data !== testCase.result.expectedResult) {
					reject(util.format('TEST FAILED !!! Method is [%s]. Expected\n[%s]\n doesn\'t match to received\n[%s]\n%s', options.method, testCase.result.expectedResult, data, testCaseAsString));
					return;
				}

				resolve('TEST PASSED !!!');
			})
		});

		if (options.data !== undefined) {
			req.write(options.data);
		}

		req.end();
	});
}

function makeGetRequestOpts(testCase) {
	const args = queryString.stringify(testCase.request.args);
	const path = util.format('%s?%s', testCase.request.source, args);

	return {
		host: TEST_HOST,
		port: TEST_PORT,
		path: path,
		method: 'GET'
	};
}

function makePostRequestOpts(testCase) {
	const data = queryString.stringify(testCase.request.args);

	return {
		host: TEST_HOST,
		port: TEST_PORT,
		path: testCase.request.source,
		data: data,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(data)
		},
		method: 'POST'
	};
}

function test(requestParams, testCase) {
	return new Promise((resolve, reject) => {
		testCaseInner(requestParams, testCase).then(
			(data) => resolve(data)
		).catch(
			(err) => reject(err)
		);
	});
}

function start() {
	// starting nexl-server
	NEXL_APP = new NexlApp();
	NEXL_APP.start();

	const promises = [];

	// iterating over test cases and running tests
	testCases.forEach(testCase => {
		const getRequestOpts = makeGetRequestOpts(testCase);
		promises.push(test(getRequestOpts, testCase));

		const postRequestOpts = makePostRequestOpts(testCase);
		promises.push(test(postRequestOpts, testCase));
	});

	return Promise.all(promises);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
