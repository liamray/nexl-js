const express = require('express');
const router = express.Router();
const clone = require('clone');

const security = require('../api/security');
const confMgmt = require('../api/conf-mgmt');
const confConsts = require('../common/conf-constants');
const restUrls = require('../common/rest-urls');
const logger = require('../api/logger');

//////////////////////////////////////////////////////////////////////////////
// add/modify webhook
//////////////////////////////////////////////////////////////////////////////

function findExistingWebhookIndex(webhooks, webhook) {
	if (webhook.id === undefined) {
		return -1;
	}

	for (let index = 0; index < webhooks.length; index++) {
		if (webhooks[index].id === webhook.id) {
			return index;
		}
	}

	return -1;
}

function applyWebhooks(webhooks) {
	return Promise.resolve();
}

function addId(webhooks, webhook) {
	webhook.id = (webhooks.length < 1) ? 1 : webhooks[webhooks.length - 1].id + 1;
}

//////////////////////////////////////////////////////////////////////////////
// add/modify webhook
//////////////////////////////////////////////////////////////////////////////
router.post(restUrls.WEBHOOKS.URLS.ADD_MODIFY_WEBHOOK, function (req, res) {
	const username = security.getLoggedInUsername(req);

	logger.log.debug(`The [${username}] user is updating a webhook`);

	if (!security.isAdmin(username)) {
		logger.log.error('The [%s] user doesn\'t have admin permissions to update a webhook', username);
		security.sendError(res, 'admin permissions required');
		return;
	}

	// web hook for update
	const webhook = req.body;

	// loading existing webhooks
	let existingWebhooks = confMgmt.getCached(confConsts.CONF_FILES.WEBHOOKS);
	existingWebhooks = clone(existingWebhooks);

	const existingWebhookIndex = findExistingWebhookIndex(existingWebhooks, webhook);
	if (existingWebhookIndex < 0) {
		addId(existingWebhooks, webhook);
		existingWebhooks.push(webhook);
	} else {
		existingWebhooks[existingWebhookIndex] = webhook;
	}

	// todo: take in account the secret

	// saving
	return confMgmt.save(existingWebhooks, confConsts.CONF_FILES.WEBHOOKS)
		.then(_ => applyWebhooks(existingWebhooks))
		.then(_ => {
			res.send({});
			logger.log.log('verbose', `Webhook is updated and applied by [${username}] user`);
		}).catch(
			(err) => {
				logger.log.error('Failed to update a webhook. Reason : [%s]', err);
				security.sendError(res, err);
			});

});

//////////////////////////////////////////////////////////////////////////////
// load webhooks
//////////////////////////////////////////////////////////////////////////////
function loadWebhooks() {
	let webhooks = confMgmt.getCached(confConsts.CONF_FILES.WEBHOOKS);
	webhooks = clone(webhooks);

	// not sending a secret to the client, iterating over webhooks and removing it
	webhooks.forEach(item => {
		if (item.secret !== undefined) {
			item.secret = confConsts.PASSWORD_STUB;
		}
	});

	return webhooks;
}


router.post(restUrls.WEBHOOKS.URLS.LOAD_WEBHOOKS, function (req, res) {
	const username = security.getLoggedInUsername(req);

	logger.log.debug(`The [${username}] user is loading webhooks list`);

	if (!security.isAdmin(username)) {
		logger.log.error('The [%s] user doesn\'t have admin permissions to load webhooks', username);
		security.sendError(res, 'admin permissions required');
		return;
	}

	const webhooks = loadWebhooks();
	res.send(webhooks);
	logger.log.log('verbose', `Webhooks list sent to the clientby [${username}] user`);
});

//////////////////////////////////////////////////////////////////////////////
// undeclared routes
//////////////////////////////////////////////////////////////////////////////
router.post('/*', function (req, res) {
	logger.log.error(`Unknown route [${req.baseUrl}]`);
	security.sendError(res, `Unknown route`, 404);
});

router.get('/*', function (req, res) {
	logger.log.error(`Unknown route [${req.baseUrl}]`);
	security.sendError(res, `Unknown route`, 404);
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
