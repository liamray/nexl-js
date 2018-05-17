// test \n and \t args

let testCases = require('./test-cases/test-cases.js');
const http = require('http');
const util = require('util');
const path = require('path');
const queryString = require('querystring');
const confMgmt = require('../../backend/api/conf-mgmt');
const cmdLineArgs = require('../../backend/api/cmd-line-args');
const NexlApp = require('../../backend/nexl-app/nexl-app');

const TEST_HOST = 'localhost';
const TEST_PORT = 8989;


function testCaseInner(options, testCase) {
	return new Promise((resolve, reject) => {
		const req = http.request(options, function (res) {
			res.setEncoding('utf8');
			let data = '';
			res.on('data', function (chunk) {
				data += chunk;
			});
			res.on('end', function () {
				const testCaseAsString = util.format('source=%s, args=%s', testCase.request.source, JSON.stringify(testCase.request.args));

				if (res.statusCode !== testCase.result.expectedStatusCode) {
					reject('Expected status code [%s] doesn\'t match to received status code [%s]\nmsg = %s\n%s', testCase.result.expectedStatusCode, res.statusCode, data, testCaseAsString);
					return;
				}

				const contentType = res.headers["content-type"];
				if (contentType !== testCase.result.expectedHeader) {
					reject(util.format('Expected header [%s] doesn\'t match to received [%s]\n%s', testCase.result.expectedHeader, contentType, testCaseAsString));
					return;
				}

				if (data !== testCase.result.expectedResult) {
					reject(util.format('Expected result\n[%s] doesn\'t match to received\n[%s]\n%s', testCase.result.expectedResult, data, testCaseAsString));
					return;
				}

				resolve();
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

class NexlTestApp extends NexlApp {
	initCongMgmt() {
	}
}

function startInner() {
	// starting nexl-server
	new NexlTestApp().start();

	return;

	const promises = [];

	// iterating over test cases and running tests
	testCases.forEach(testCase => {
		const getRequestOpts = makeGetRequestOpts(testCase);
		promises.push(test(getRequestOpts, testCase));

		const postRequestOpts = makePostRequestOpts(testCase);
		promises.push(test(postRequestOpts, testCase));
	});

	Promise.all(promises).then(
		() => {
			console.log('All tests are passed !!!');
		}
	).catch(
		(err) => {
			console.log('Failed !');
			console.log(err);
		}
	);
}

function start() {
	const workingDir = process.cwd();
	const nexlHomeDir = path.join(workingDir, '.nexl');
	const nexlSourcesDir = path.join(workingDir, 'nexl-sources');
	process.argv.push(util.format('--%s=%s',cmdLineArgs.NEXL_HOME_DEF, nexlHomeDir ));

	confMgmt.init();

	confMgmt.loadAsync(confMgmt.CONF_FILES.SETTINGS).then(settings => {

		settings[confMgmt.SETTINGS.HTTP_PORT] = TEST_PORT;
		settings[confMgmt.SETTINGS.HTTP_BINDING] = TEST_HOST;
		settings[confMgmt.SETTINGS.NEXL_SOURCES_DIR] = nexlSourcesDir;

		return confMgmt.saveAsync(settings, confMgmt.CONF_FILES.SETTINGS).then(() => {
			startInner();
		});
	}).catch((err) => {
		console.log(err);
	});
}

start();
