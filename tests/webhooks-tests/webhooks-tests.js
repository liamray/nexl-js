const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');

const assert = require('assert');

const testAPI = require('../test-api');
const confConsts = require('../../backend/common/conf-constants');
const confMgmt = require('../../backend/api/conf-mgmt');
const security = require('../../backend/api/security');
const securityConsts = require('../../backend/common/security-constants');
const storageUtils = require('../../backend/api/storage-utils');

const webhooks = require('../../backend/api/webhooks');

// --------------------------------------------------------------------------------
// tests
// --------------------------------------------------------------------------------
function timeout() {
	return new Promise((resolve, reject) => {
		setTimeout(_ => {
			resolve();
		}, 2500);
	});
}

function runTests() {
	// adding a webhook
	const existingWebhooks = confMgmt.getCached(confConsts.CONF_FILES.WEBHOOKS);
	existingWebhooks.push({
		id: 1,
		relativePath: '*',
		url: 'http://localhost:8181',
		isDisabled: false
	});
	confMgmt.save(existingWebhooks, confConsts.CONF_FILES.WEBHOOKS)
		.then(storageUtils.saveFileToStorage('/test.js', '// hello'));

	return Promise.resolve();
}

// --------------------------------------------------------------------------------
// webhooks app
// --------------------------------------------------------------------------------

const PORT = 8181;
const SECRET = 'nexl';
let webServer;

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

	const hmac = crypto.createHmac('sha1', SECRET);
	const digest = 'sha1=' + hmac.update(payload).digest('hex');
	if (!checksum || !digest || checksum !== digest) {
		return next(`Request body digest (${digest}) did not match ${webhooks.SIG_HEADER} (${checksum})`)
	}

	return next();
}

app.post('/', handleWebhook, function (req, res) {
	res.status(200).send('Request body was signed')
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
	return Promise.resolve();
}

function run() {
	return startWebhooksClient()
		.then(runTests);
}

function done() {
	return timeout().then(_ => {
		if (webServer) {
			webServer.close();
		}
		return Promise.resolve();
	});
}

testAPI.startNexlApp(init, run, done);

/*
Tests:

*
/common
/common/
/common*
!/common
*.js
with right secret
with wrong secret
all actions for same file

 */