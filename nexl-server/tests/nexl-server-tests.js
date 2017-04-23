// test \n and \t args

const nexlServer = require('../nexl-server');
const testCases = require('./test-cases.js');
const http = require('http');
const util = require('util');
const queryString = require('querystring');

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 8080;

var testCasesCnt = 0;

function analyzeResult(testCase, res, data) {
	testCasesCnt--;

	var testCaseAsString = util.format('source=%s, args=%s', testCase.request.source, JSON.stringify(testCase.request.args));

	if (res.statusCode !== testCase.result.expectedStatusCode) {
		throw util.format('Expected status code [%s] doesn\'t match to received status code [%s]\nmsg = %s\n%s', testCase.result.expectedStatusCode, res.statusCode, data, testCaseAsString);
	}

	var contentType = res.headers["content-type"];
	if (contentType !== testCase.result.expectedHeader) {
		throw util.format('Expected header [%s] doesn\'t match to received [%s]\n%s', testCase.result.expectedHeader, contentType, testCaseAsString);
	}

	if (data !== testCase.result.expectedResult) {
		throw util.format('Expected result\n[%s] doesn\'t match to received\n[%s]\n%s', testCase.result.expectedResult, data, testCaseAsString);
	}

	console.log('Test %s is passed OK', testCasesCnt);
}

function testCaseInner(options, testCase) {
	testCasesCnt++;

	var req = http.request(options, function (res) {
		res.setEncoding('utf8');
		var data = '';
		res.on('data', function (chunk) {
			data += chunk;
		});
		res.on('end', function () {
			analyzeResult(testCase, res, data);
		})
	});

	req.on('error', function (e) {
		console.log(e);
		analyzeResult(testCase, res, null);
	});

	if (options.data !== undefined) {
		req.write(options.data);
	}
	req.end();
}

function makeGetRequestOpts(testCase) {
	var args = queryString.stringify(testCase.request.args);
	var path = util.format('%s?%s', testCase.request.source, args);

	return {
		host: DEFAULT_HOST,
		port: DEFAULT_PORT,
		path: path,
		method: 'GET'
	};
}

function makePostRequestOpts(testCase) {
	var data = queryString.stringify(testCase.request.args);

	return {
		host: DEFAULT_HOST,
		port: DEFAULT_PORT,
		path: testCase.request.source,
		data: data,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(data)
		},
		method: 'POST'
	};
}

function test(testCase) {
	var getRequestOpts = makeGetRequestOpts(testCase);
	testCaseInner(getRequestOpts, testCase);

	var postRequestOpts = makePostRequestOpts(testCase);
	testCaseInner(postRequestOpts, testCase);
}

function waitAndExit(server) {
	var id = setInterval(function () {
		if (testCasesCnt < 1) {
			server.close();
			clearInterval(id);
		}
	}, 100);
}

function start() {
	// pointing nexl-server to existing nexl-source from nexl-engine
	process.argv.push('--nexl-sources=../../nexl-engine/tests/nexl-sources');
	process.argv.push('--port=' + DEFAULT_PORT);
	process.argv.push('--binding=' + DEFAULT_HOST);
	process.argv.push('--log-level=verbose');

	// starting nexl-server
	var server = nexlServer();

	// iterating over test cases and running tests
	for (var index in testCases) {
		var testCase = testCases[index];
		test(testCase);
	}

	waitAndExit(server);
}

start();
