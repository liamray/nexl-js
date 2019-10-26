const confMgmt = require('../api/conf-mgmt');
const confConsts = require('../common/conf-constants');
const logger = require('./logger');
const utils = require('./utils');
const base64 = require('base-64');
const rp = require('request-promise');
const crypto = require('crypto');

const sigHeaderName = 'X-Hub-Signature';

function postWebhook(webhook, target) {
	const reqOpts = {
		method: 'POST',
		resolveWithFullResponse: true,
		uri: webhook.url,
		body: {
			webhook: webhook.relativePath,
			target: target.relativePath,
			action: target.action // created | moved | deleted
		},
		json: true
	};

	if (!utils.isEmptyStr(webhook.secret)) {
		// decrypting the secret
		const secret = base64.decode(webhook.secret);

		// encrypting the body with a secret
		const hmac = crypto.createHmac('sha1', secret);
		reqOpts[sigHeaderName] = 'sha1=' + hmac.update(JSON.stringify(reqOpts.body)).digest('hex');
	}

	rp(reqOpts)
		.then(function (response) {
			logger.log.info(`Successfully fired the webhook. [id=${webhook.id}] [url=${webhook.url}] [relativePath=${webhook.relativePath}] [target=${target.relativePath}] [action=${target.action}], [httpResponse=${response.statusCode}]`);
		})
		.catch(function (err) {
			logger.log.error(`Webhook HTTP POST request failed. [id=${webhook.id}] [url=${webhook.url}] [relativePath=${webhook.relativePath}] [target=${target.relativePath}] [action=${target.action}], [httpResponse=${err.statusCode}]. The reason is [${utils.formatErr(err)}]`);
		});
}

function fireWebhook(webhook, target) {
	// is exact match ?
	if (webhook.relativePath === target.relativePath && webhook.isDisabled !== true) {
		postWebhook(webhook, target);
		return;
	}

	// is sub dir match ? ( the [webhook.relativePath] must be ended with slash for that )
	if (webhook.relativePath.endsWith('/') || webhook.relativePath.endsWith('\\')) {
		if (target.relativePath.indexOf(webhook.relativePath) === 0 && webhook.isDisabled !== true) {
			postWebhook(webhook, target);
		}
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