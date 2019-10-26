const confMgmt = require('../api/conf-mgmt');
const confConsts = require('../common/conf-constants');
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('./logger');
const utils = require('./utils');

const sigHeaderName = 'X-Hub-Signature';

const app = express();
app.use(bodyParser.json());

/*
function verifyPostData(req, res, next) {
	const payload = JSON.stringify(req.body);
	if (!payload) {
		return next('Request body empty')
	}

	const hmac = crypto.createHmac('sha1', secret);
	const digest = 'sha1=' + hmac.update(payload).digest('hex');
	const checksum = req.get(sigHeaderName);
	if (!checksum || !digest || checksum !== digest) {
		return next(`Request body digest (${digest}) did not match ${sigHeaderName} (${checksum})`)
	}
	return next()
}
*/

function postWebhook(webhook, target) {
	const reqOpts = {
		method: 'POST',
		uri: webhook.url,
		body: {
			webhook: webhook.relativePath,
			target: target.relativePath,
			action: target.action // created | moved | deleted
		},
		json: true
	};

	if (webhook.secret) {
		reqOpts[sigHeaderName] = '...';
	}

	rp(reqOpts)
		.then(function (parsedBody) {
			// todo: Log the HTTP response code
			logger.log.debug(`Webhook HTTP POST request failed. [id=${webhook.id}] [url=${webhook.url}] [relativePath=${webhook.relativePath}] [target=${target.relativePath}] [action=${target.action}]. The reason is [${utils.formatErr(err)}]`);
		})
		.catch(function (err) {
			// todo: Log the HTTP error code
			logger.log.error(`Webhook HTTP POST request failed. [id=${webhook.id}] [url=${webhook.url}] [relativePath=${webhook.relativePath}] [target=${target.relativePath}] [action=${target.action}]. The reason is [${utils.formatErr(err)}]`);
		});
}

function fireWebhook(webhook, target) {
	// is exact match ?
	if (webhook.relativePath === target.relativePath) {
		postWebhook(webhook, target);
		return;
	}

	// is sub dir match ? ( the [webhook.relativePath] must be ended with slash for that )
	if (webhook.relativePath.endsWith('/') && webhook.relativePath.indexOf(target.relativePath) === 0) {
		postWebhook(webhook, target);
		return;
	}
}

function fireWebhooks(target) {
	const webhooks = confMgmt.getCached(confConsts.CONF_FILES.WEBHOOKS);
	webhooks.forEach(webhook => fireWebhook(webhook, target));
	return Promise.resolve();
}

// --------------------------------------------------------------------------------
module.exports.fireWebhooks = fireWebhooks;
// --------------------------------------------------------------------------------