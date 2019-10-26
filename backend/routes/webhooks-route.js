const express = require('express');
const router = express.Router();
const clone = require('clone');

const security = require('../api/security');
const confMgmt = require('../api/conf-mgmt');
const confConsts = require('../common/conf-constants');
const restUrls = require('../common/rest-urls');
const logger = require('../api/logger');
const utils = require('../api/utils');

//////////////////////////////////////////////////////////////////////////////
// edit a webhook
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

function addNewWebhook(existingWebhooks, newWebhook) {
	// calculating new id
	newWebhook.id = (existingWebhooks.length < 1) ? 1 : existingWebhooks[existingWebhooks.length - 1].id + 1;

	// adding a new webhook
	existingWebhooks.push(newWebhook);
}

function updateExistingWebhook(existingWebhooks, existingWebhookIndex, webhook) {
	// handling the secret
	const secret = existingWebhooks[existingWebhookIndex].secret;
	if (webhook.secret === confConsts.PASSWORD_STUB) {
		webhook.secret = secret;
	}

	// updating...
	existingWebhooks[existingWebhookIndex] = webhook;
}

router.post(restUrls.WEBHOOKS.URLS.EDIT_WEBHOOK, function (req, res) {
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
		addNewWebhook(existingWebhooks, webhook);
	} else {
		updateExistingWebhook(existingWebhooks, existingWebhookIndex, webhook);
	}

	// saving
	return confMgmt.save(existingWebhooks, confConsts.CONF_FILES.WEBHOOKS)
		.then(_ => {
			res.send({id: webhook.id});
			logger.log.log('verbose', `Webhook is updated and applied by [${username}] user, [webhookId=${webhook.id}]`);
		}).catch(
			(err) => {
				logger.log.error('Failed to update a webhook. Reason : [%s]', err);
				security.sendError(res, err);
			});

});
//////////////////////////////////////////////////////////////////////////////
// delete a webhook
//////////////////////////////////////////////////////////////////////////////

function findWebhook2Delete(webhooks, webhook) {
	let index = -1;
	for (let i in webhooks) {
		if (webhooks[i].id === webhook.id) {
			index = i;
			break;
		}
	}

	return index;
}

router.post(restUrls.WEBHOOKS.URLS.DELETE_WEBHOOK, function (req, res) {
	const username = security.getLoggedInUsername(req);

	logger.log.debug(`The [${username}] user is deleting a webhook`);

	if (!security.isAdmin(username)) {
		logger.log.error('The [%s] user doesn\'t have admin permissions to delete a webhook', username);
		security.sendError(res, 'admin permissions required');
		return;
	}

	// web hook for update
	const webhook = req.body;

	// loading existing webhooks and cloning it
	const webhooks = clone(confMgmt.getCached(confConsts.CONF_FILES.WEBHOOKS));
	const index = findWebhook2Delete(webhooks, webhook);

	if (index < 0) {
		logger.log.error(`Trying to delete a webhook with unknown [id=${webhook.id}]`);
		security.sendError(res, `Trying to delete a webhook with unknown [id=${webhook.id}]`);
		return;
	}

	// removing a webhook
	webhooks.splice(index, 1);

	// saving
	return confMgmt.save(webhooks, confConsts.CONF_FILES.WEBHOOKS)
		.then(_ => {
			res.send({id: webhook.id});
			logger.log.log('verbose', `Webhook is deleted by [${username}] user, [id=${webhook.id}]`);
		}).catch(
			(err) => {
				logger.log.error('Failed to delete a webhook [id=${webhook.id}]. Reason : [%s]', err);
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
		if (!utils.isEmptyStr(item.secret)) {
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
	logger.log.log('verbose', `Webhooks list sent to the client, requested by [${username}] user`);
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
