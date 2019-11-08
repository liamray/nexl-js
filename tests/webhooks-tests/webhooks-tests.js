const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');
const base64 = require('base-64');

const testAPI = require('../test-api');
const confConsts = require('../../backend/common/conf-constants');
const confMgmt = require('../../backend/api/conf-mgmt');
const storageUtils = require('../../backend/api/storage-utils');

const webhooks = require('../../backend/api/webhooks');


const PORT = 8181;
const THE_SECRET = 'this is a secret !';

const webhooks2Test = [
	{
		// everything
		id: 0,
		relativePath: '*',
		url: `http://localhost:${PORT}`,
		isDisabled: false
	},
	{
		// won't work, path must be started with a slash
		id: 1,
		relativePath: 'common',
		url: `http://localhost:${PORT}`,
		isDisabled: false
	},
	{
		id: 2,
		relativePath: '/common',
		url: `http://localhost:${PORT}`,
		isDisabled: false
	},
	{
		id: 3,
		relativePath: '/common*',
		url: `http://localhost:${PORT}`,
		isDisabled: false
	},
	{
		id: 4,
		relativePath: '!/common',
		url: `http://localhost:${PORT}`,
		isDisabled: false
	},
	{
		id: 5,
		relativePath: '*.js',
		url: `http://localhost:${PORT}`,
		isDisabled: false
	},
	{
		id: 6,
		relativePath: '/common/test.js',
		url: `http://localhost:${PORT}`,
		isDisabled: false
	},
	{
		id: 7,
		relativePath: '/common/test.js',
		secret: '111111111111111111111111111111111',
		url: `http://localhost:${PORT}`,
		isDisabled: true
	},
	{
		id: 8,
		relativePath: '/common/test.js',
		secret: base64.encode('wrong secret'),
		url: `http://localhost:${PORT}`,
		isDisabled: true
	},
	{
		id: 9,
		relativePath: '/common/test.js',
		secret: base64.encode(THE_SECRET),
		url: `http://localhost:${PORT}`,
		isDisabled: true
	}
];

const expectingResults = [{webhook: '*', target: '/common', action: 'update'},
	{webhook: '/common', target: '/common', action: 'update'},
	{webhook: '/common*', target: '/common', action: 'update'},
	{webhook: '*', target: '/test', action: 'update'},
	{webhook: '!/common', target: '/test', action: 'update'},
	{webhook: '*', target: '/common/test.js', action: 'update'},
	{webhook: '/common*', target: '/common/test.js', action: 'update'},
	{webhook: '!/common', target: '/common/test.js', action: 'update'},
	{webhook: '*.js', target: '/common/test.js', action: 'update'},
	{webhook: '/common/test.js', target: '/common/test.js', action: 'update'},
	{webhook: '/common/test.js', target: '/common/test.js', action: 'rename'},
	{webhook: '/common/test.js', target: '/common/test.js', action: 'move'},
	{webhook: '/common/test.js', target: '/common/test.js', action: 'delete'}
];

// --------------------------------------------------------------------------------
// tests
// --------------------------------------------------------------------------------
function timeout() {
	return new Promise((resolve, reject) => {
		setTimeout(_ => {
			resolve();
		}, 1000);
	});
}

function updateWebhooks(state) {
	for (let index = 0; index < webhooks2Test.length; index++) {
		webhooks2Test[index].isDisabled = state[index];
	}

	return confMgmt.save(webhooks2Test, confConsts.CONF_FILES.WEBHOOKS);
}

function runTests() {
	return storageUtils.mkdir('/common')
		.then(timeout)
		.then(_ => storageUtils.mkdir('/test'))
		.then(_ => storageUtils.saveFileToStorage('/common/test.js', ''))
		//                           0     1     2     3     4     5     6      7     8      9
		.then(_ => updateWebhooks([true, false, true, true, true, true, true, true, true, true]))
		.then(_ => storageUtils.saveFileToStorage('/common/test.js', ''))
		//                           0     1     2     3     4     5     6      7     8       9
		.then(_ => updateWebhooks([true, false, true, true, true, true, false, true, true, true]))
		.then(_ => storageUtils.rename('/common/test.js', '/common/test2.js'))
		.then(_ => storageUtils.saveFileToStorage('/common/test2.js', ''))
		.then(_ => storageUtils.rename('/common/test2.js', '/common/test.js'))
		.then(_ => storageUtils.move('/common/test.js', '/'))
		.then(_ => storageUtils.move('/test.js', '/common'))
		//                           0     1     2     3     4     5     6       7      8     9
		.then(_ => updateWebhooks([true, true, true, true, true, true, true, false, false, false]))
		.then(_ => storageUtils.deleteItem('/common/test.js'))
		;
}

function checkTestResults() {
	let counter = 0;
	webhookResults.forEach(outer => {
		expectingResults.forEach(inner => {
			if (JSON.stringify(outer) === JSON.stringify(inner)) {
				counter++;
			}
		})
	});

	return counter === expectingResults.length ? Promise.resolve() : Promise.reject();
}

// --------------------------------------------------------------------------------
// webhooks app
// --------------------------------------------------------------------------------

let webServer;

const webhookResults = [];

const app = express();
app.use(bodyParser.json());

function handleWebhook(req, res, next) {
	const payload = JSON.stringify(req.body);
	if (!payload) {
		return next('Request body empty')
	}

	const checksum = req.get(webhooks.SIG_HEADER);
	if (!checksum) {
		return next();
	}

	const hmac = crypto.createHmac('sha1', THE_SECRET);
	const digest = 'sha1=' + hmac.update(payload).digest('hex');
	if (!checksum || !digest || checksum !== digest) {
		return next(`Request body digest (${digest}) did not match ${webhooks.SIG_HEADER} (${checksum})`)
	}

	return next();
}

app.post('/', handleWebhook, function (req, res) {
	webhookResults.push(req.body);
	res.status(200).send('Ok');
});

app.use((err, req, res, next) => {
	if (err) {
		console.error(err);
		res.status(403).send('Webhook failed !!!');
	}
});


function startWebhooksClient() {
	return new Promise((resolve, reject) => {
		webServer = app.listen(PORT, 'localhost', () => {
			resolve();
		}).on('error', err => {
			console.log(err);
			reject(err);
		});
	});
}

// --------------------------------------------------------------------------------
// nexl app
// --------------------------------------------------------------------------------

function init(predefinedNexlJSFIlesDir, tmpNexlJSFilesDir) {
	// adding a webhooks
	return confMgmt.save(webhooks2Test, confConsts.CONF_FILES.WEBHOOKS);
}

function run() {
	return startWebhooksClient()
		.then(runTests);
}

function done() {
	return checkTestResults()
		.then(_ => {
			if (webServer) {
				webServer.close();
			}
			return Promise.resolve();
		});
}

testAPI.startNexlApp(init, run, done);
