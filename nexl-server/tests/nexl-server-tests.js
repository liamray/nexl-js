// test POST requests !
// test POST requests !
// test POST requests !
// test POST requests !
// test POST requests !

const nexlServer = require('../nexl-server');
const testCases = require('./test-cases.js');
const http = require('http');
const util = require('util');

((function () {

	function analyzeResult(testCase, res, data) {
		if (res.statusCode !== testCase.result.expectedStatusCode) {
			throw util.format('Expected status code [%s] doesn\'t match to received status code [%s]', testCase.result.expectedStatusCode, res.statusCode);
		}

		var contentType = res.headers["content-type"];
		if (contentType !== testCase.result.expectedHeader) {
			throw util.format('Expected header [%s] doesn\'t match to received [%s]', testCase.result.expectedHeader, contentType);
		}

		if (data !== testCase.result.expectedResult) {
			throw util.format('Expected result\n[%s] doesn\'t match to received\n[%s]', testCase.result.expectedResult, data);
		}

		console.log('Test passed OK');
	}

	function test(testCase) {
		var req = http.request(testCase.options, function (res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				analyzeResult(testCase, res, chunk);
			});
		});

		req.on('error', function (e) {
			analyzeResult(testCase, res, null);
		});

		if (testCase.options.data !== undefined) {
			req.write(testCase.options.data);
		}
		req.end();
	}


	function start() {
		// pointing nexl-server to existing nexl-source from nexl-engine
		process.argv.push('--nexl-source=../../nexl-engine/tests/nexl-sources');

		// starting nexl-server
		nexlServer();

		// iterating over test cases and running tests
		for (var index in testCases) {
			var testCase = testCases[index];
			test(testCase);
		}
	}

	start();

})());
