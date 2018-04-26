const express = require('express');
const path = require('path');
const j79 = require('j79-utils');

const sources = require('./sources-route-impl');
const utils = require('../../api/utils');
const security = require('../../api/security');
const logger = require('../../api/logger');
const fsx = require('../../api/fsx');

const router = express.Router();

//////////////////////////////////////////////////////////////////////////////
// delete-item
//////////////////////////////////////////////////////////////////////////////
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

//////////////////////////////////////////////////////////////////////////////
// make-dir
//////////////////////////////////////////////////////////////////////////////
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

//////////////////////////////////////////////////////////////////////////////
// list-nexl-source
//////////////////////////////////////////////////////////////////////////////
router.post('/list-nexl-sources', function (req, res, next) {
	const relativePath = req.body['relativePath'] || path.sep;
	const username = utils.getLoggedInUsername(req);

	security.hasReadPermission(username).then((hasPermission) => {
		if (!hasPermission) {
			logger.log.error('The [%s] user doesn\'t have read permissions to list nexl sources', username);
			return Promise.reject('No read permissions');
		}

		return sources.listNexlSources(relativePath).then(data => res.send(data));
	}).catch((err) => {
		logger.log.error('Failed to list nexl sources for [%s] user. Reason : [%s]', username, err);
		utils.sendError(res, err);
	});
});

//////////////////////////////////////////////////////////////////////////////
// load-nexl-source
//////////////////////////////////////////////////////////////////////////////
router.post('/load-nexl-source', function (req, res, next) {
	const relativePath = req.body['relativePath'] || path.sep;
	const username = utils.getLoggedInUsername(req);

	security.hasReadPermission(username).then((hasPermission) => {
		if (!hasPermission) {
			logger.log.error('The [%s] user doesn\'t have read permissions to load nexl source', username);
			return Promise.reject('No read permissions');
		}

		return sources.loadNexlSource(relativePath).then(data => res.send(data));
	}).catch((err) => {
		logger.log.error('Failed to get nexl source content for [%s] user. Reason : [%s]', username, err);
		utils.sendError(res, err);
	});
});

//////////////////////////////////////////////////////////////////////////////
// save-nexl-source
//////////////////////////////////////////////////////////////////////////////
router.post('/save-nexl-source', function (req, res, next) {
	let relativePath = req.body['relativePath'];
	let content = req.body['content'];

	// validating ( must not empty string )
	if (!j79.isString(relativePath) || relativePath.length < 1) {
		logger.log.error('Invalid relativePath');
		utils.sendError(res, 'Invalid relativePath');
		return;
	}

	const username = utils.getLoggedInUsername(req);

	security.hasWritePermission(username).then((hasPermission) => {
		if (!hasPermission) {
			logger.log.error('The [%s] user doesn\'t have write permissions to save nexl source items', username);
			return Promise.reject('No write permissions');
		}

		return sources.saveNexlSource(relativePath, data).then(() => res.send({}));
	}).catch((err) => {
		logger.log.error('Failed to get nexl source content for [%s] user. Reason : [%s]', username, err);
		utils.sendError(res, err);
	});
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
