const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const testAPI = require('../test-api');
const confConsts = require('../../backend/common/conf-constants');
const confMgmt = require('../../backend/api/conf-mgmt');
const security = require('../../backend/api/security');
const securityConsts = require('../../backend/common/security-constants');
const storageUtils = require('../../backend/api/storage-utils');

const webhooks = require('../../backend/api/webhooks');


const PORT = 8181;
const THE_SECRET = 'this is a secret !';

const webhooks2Test = [
	{
		// everything
		id: 1,
		relativePath: '*',
		url: `http://localhost:${PORT}`,
		isDisabled: false
	},
	{
		// disabled
		id: 2,
		relativePath: '*',
		url: `http://localhost:${PORT}`,
		isDisabled: true
	},
	{
		// won't work, path must be started with a slash
		id: 3,
		relativePath: 'common',
		url: `http://localhost:${PORT}`,
		isDisabled: false
	},
	{
		id: 4,
		relativePath: '/common',
		url: `http://localhost:${PORT}`,
		isDisabled: false
	},
	{
		id: 5,
		relativePath: '/common*',
		url: `http://localhost:${PORT}`,
		isDisabled: false
	},
	{
		id: 6,
		relativePath: '!/common',
		url: `http://localhost:${PORT}`,
		isDisabled: false
	},
	{
		id: 7,
		relativePath: '*.js',
		url: `http://localhost:${PORT}`,
		isDisabled: false
	},
	{
		id: 8,
		relativePath: '/common/test.js',
		secret: 'wrong secret',
		url: `http://localhost:${PORT}`,
		isDisabled: false
	},
	{
		id: 9,
		relativePath: '/common/test.js',
		secret: THE_SECRET,
		url: `http://localhost:${PORT}`,
		isDisabled: false
	}
];

const expectingResults = [
	{webhook: '*', target: '/common', action: 'update'},
	{webhook: '/common', target: '/common', action: 'update'},
	{webhook: '/common*', target: '/common', action: 'update'}
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

function runTests() {
	return storageUtils.mkdir('/common')
		.then(timeout)
		.then(_ => storageUtils.mkdir('/test'))
		.then(_ => storageUtils.saveFileToStorage('/common/test.js', ''))
		;
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
	console.log(webhookResults);
	return timeout().then(_ => {
		if (webServer) {
			webServer.close();
		}
		return Promise.resolve();
	});
}

testAPI.startNexlApp(init, run, done);
