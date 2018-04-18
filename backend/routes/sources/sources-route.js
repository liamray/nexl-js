const express = require('express');
const path = require('path');
const j79 = require('j79-utils');

const sources = require('./sources-route-impl');
const utils = require('../../api/utils');
const security = require('../../api/security');
const logger = require('../../api/logger');
const fsx = require('../../api/fsx');

const router = express.Router();

router.post('/delete-item', function (req, res, next) {
	let relativePath = req.body['relativePath'];

	// validating ( must not empty string )
	if (!j79.isString(relativePath) || relativePath.length < 1) {
		logger.log.error('Invalid relativePath');
		utils.sendError(res, 'Invalid relativePath');
		return;
	}

	const username = utils.getLoggedInUsername(req);

	security.hasWritePermission(username).then((hasPermission) => {
		if (!hasPermission) {
			logger.log.error('The [%s] user doesn\'t have write permissions to delete items', username);
			return Promise.reject('No write permissions');
		}

		return sources.deleteItem(relativePath).then(() => res.send({}));
	}).catch((err) => {
		logger.log.error('Failed to get nexl source content for [%s] user. Reason : [%s]', username, err);
		utils.sendError(res, err);
	});
});

router.post('/make-dir', function (req, res, next) {
	let relativePath = req.body['relativePath'];

	// validating ( must not empty string )
	if (!j79.isString(relativePath) || relativePath.length < 1) {
		logger.log.error('Invalid relativePath');
		utils.sendError(res, 'Invalid relativePath');
		return;
	}

	const username = utils.getLoggedInUsername(req);

	security.hasWritePermission(username).then((hasPermission) => {
		if (!hasPermission) {
			logger.log.error('The [%s] user doesn\'t have write permissions to create new directory', username);
			return Promise.reject('No write permissions');
		}

		return sources.mkdir(relativePath).then(() => res.send({}));
	}).catch((err) => {
		logger.log.error('Failed to get nexl source content for [%s] user. Reason : [%s]', username, err);
		utils.sendError(res, err);
	});
});

router.post('/get-source-content', function (req, res, next) {
	const relativePath = req.body['relativePath'] || path.sep;
	const username = utils.getLoggedInUsername(req);

	security.hasReadPermission(username).then((hasPermission) => {
		if (!hasPermission) {
			logger.log.error('The [%s] user doesn\'t have read permissions to get nexl source content', username);
			return Promise.reject('No read permissions');
		}

		return sources.getSourceContent(relativePath).then(data => res.send(data));
	}).catch((err) => {
		logger.log.error('Failed to get nexl source content for [%s] user. Reason : [%s]', username, err);
		utils.sendError(res, err);
	});
});

router.post('/get-nexl-sources', function (req, res, next) {
	const relativePath = req.body['relativePath'] || path.sep;
	const username = utils.getLoggedInUsername(req);

	security.hasReadPermission(username).then((hasPermission) => {
		if (!hasPermission) {
			logger.log.error('The [%s] user doesn\'t have read permissions to list nexl sources', username);
			return Promise.reject('No read permissions');
		}

		return sources.getNexlSources(relativePath).then(data => res.send(data));
	}).catch((err) => {
		logger.log.error('Failed to list nexl sources for [%s] user. Reason : [%s]', username, err);
		utils.sendError(res, err);
	});
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
