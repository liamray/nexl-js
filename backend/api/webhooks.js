const confMgmt = require('../api/conf-mgmt');
const confConsts = require('../common/conf-constants');
const logger = require('./logger');
const utils = require('./utils');
const base64 = require('base-64');
const axios = require('axios');
const crypto = require('crypto');
const matcher = require('matcher');
const os = require('os');

const SIG_HEADER = 'X-Hub-Signature';
const WEBHOOKS_TIMEOUT = 5000;

function postWebhook(webhook, target) {
	logger.log.debug(`The [id=${webhook.id}] [url=${webhook.url}] [relativePath=${webhook.relativePath}] webhook matches a [target=${target.relativePath}] resource. Firing this webhook.`);

	const reqOpts = {
		method: 'POST',
		url: webhook.url,
		data: {
			webhook: webhook.relativePath,
			target: target.relativePath,
			action: target.action // created | moved | deleted
		},
		headers: {},
		timeout: WEBHOOKS_TIMEOUT,
		responseType: 'json'
	};

	if (!utils.isEmptyStr(webhook.secret)) {
		// decrypting the secret
		let secret;
		try {
			secret = base64.decode(webhook.secret);
		} catch (err) {
			logger.log.error(`Failed to decrypt a secret for the [id=${webhook.id}] [url=${webhook.url}] [relativePath=${webhook.relativePath}] [target=${target.relativePath}] [action=${target.action}] webhook. This webhook won't be fired ! Reason is [${utils.formatErr(err)}]`);
			return;
		}

		// encrypting the body with a secret
		const hmac = crypto.createHmac('sha1', secret);
		reqOpts.headers[SIG_HEADER] = 'sha1=' + hmac.update(JSON.stringify(reqOpts.data)).digest('hex');
	}

	axios(reqOpts)
		.then(function (response) {
			logger.log.debug(`Successfully fired the webhook. [id=${webhook.id}] [url=${webhook.url}] [relativePath=${webhook.relativePath}] [target=${target.relativePath}] [action=${target.action}], [httpResponse=${response.statusCode}]`);
		})
		.catch(function (err) {
			logger.log.error(`Webhook HTTP POST request failed. [id=${webhook.id}] [url=${webhook.url}] [relativePath=${webhook.relativePath}] [target=${target.relativePath}] [action=${target.action}], [httpResponse=${err.statusCode}]. The reason is [${utils.formatErr(err)}]`);
		});
}

function fireWebhooks(target) {
	const webhooks = confMgmt.getCached(confConsts.CONF_FILES.WEBHOOKS);
	webhooks.forEach(webhook => {
		if (webhook.isDisabled === true) {
			logger.log.debug(`Skipping a [${webhook.relativePath}] webhook because it's disabled`);
			return;
		}

		// checking is webhook matches a target resource
		const opts = {
			caseSensitive: os.platform() !== 'win32'
		};
		if (matcher.isMatch(target.relativePath, webhook.relativePath, opts)) {
			postWebhook(webhook, target);
		} else {
			logger.log.debug(`The [${webhook.relativePath}] webhook doesn't match to [${target.relativePath}] resource`);
		}
	});
	return Promise.resolve();
}

// --------------------------------------------------------------------------------
module.exports.fireWebhooks = fireWebhooks;
module.exports.SIG_HEADER = SIG_HEADER;
// --------------------------------------------------------------------------------