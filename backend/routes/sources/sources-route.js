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
// move item
//////////////////////////////////////////////////////////////////////////////
router.post('/move', function (req, res, next) {
	let source = req.body['source'];
	let dest = req.body['dest'];

	// validating ( must not empty string )
	if (!j79.isString(source) || source.length < 1) {
		logger.log.error('Invalid source item');
		utils.sendError(res, 'Invalid source item');
		return;
	}

	// validating
	if (!j79.isString(dest)) {
		logger.log.error('Invalid dest item');
		utils.sendError(res, 'Invalid dest item');
		return;
	}

	const username = utils.getLoggedInUsername(req);

	if (!security.hasWritePermission(username)) {
		logger.log.error('The [%s] user doesn\'t have write permissions to move items', username);
		utils.sendError(res, 'No write permissions');
		return;
	}

	return sources.move(source, dest).then(() => res.send({}))
		.catch(
			(err) => {
				logger.log.error('Failed to move a [%s] file to [%s] for [%s] user. Reason : [%s]', source, dest, username, err);
				utils.sendError(res, err);
			});
});

//////////////////////////////////////////////////////////////////////////////
// rename item
//////////////////////////////////////////////////////////////////////////////
router.post('/rename', function (req, res, next) {
	let relativePath = req.body['relativePath'];
	let newRelativePath = req.body['newRelativePath'];

	// validating ( must not empty string )
	if (!j79.isString(relativePath) || relativePath.length < 1) {
		logger.log.error('Invalid relativePath');
		utils.sendError(res, 'Invalid relativePath');
		return;
	}

	// validating ( must not empty string )
	if (!j79.isString(newRelativePath) || newRelativePath.length < 1) {
		logger.log.error('Invalid newRelativePath');
		utils.sendError(res, 'Invalid newRelativePath');
		return;
	}

	const username = utils.getLoggedInUsername(req);

	if (!security.hasWritePermission(username)) {
		logger.log.error('The [%s] user doesn\'t have write permissions to rename items', username);
		utils.sendError(res, 'No write permissions');
		return;
	}

	return sources.rename(relativePath, newRelativePath).then(() => res.send({}))
		.catch(
			(err) => {
				logger.log.error('Failed to rename a [%s] file to [%s] for [%s] user. Reason : [%s]', relativePath, newRelativePath, username, err);
				utils.sendError(res, err);
			});
});

//////////////////////////////////////////////////////////////////////////////
// delete item
//////////////////////////////////////////////////////////////////////////////
router.post('/delete', function (req, res, next) {
	let relativePath = req.body['relativePath'];

	// validating ( must not empty string )
	if (!j79.isString(relativePath) || relativePath.length < 1) {
		logger.log.error('Invalid relativePath');
		utils.sendError(res, 'Invalid relativePath');
		return;
	}

	const username = utils.getLoggedInUsername(req);
	if (!security.hasWritePermission(username)) {
		logger.log.error('The [%s] user doesn\'t have write permissions to delete items', username);
		utils.sendError(res, 'No write permissions');
		return;
	}

	return sources.deleteItem(relativePath).then(() => res.send({}))
		.catch(
			(err) => {
				logger.log.error('Failed to delete a [%s] item for [%s] user. Reason : [%s]', relativePath, username, err);
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

	if (!security.hasWritePermission(username)) {
		logger.log.error('The [%s] user doesn\'t have write permissions to create new directory', username);
		utils.sendError(res, 'No write permissions');
		return;
	}

	return sources.mkdir(relativePath).then(() => res.send({}))
		.catch(
			(err) => {
				logger.log.error('Failed to create a [%s] directory for [%s] user. Reason : [%s]', relativePath, username, err);
				utils.sendError(res, err);
			});
});

//////////////////////////////////////////////////////////////////////////////
// list-nexl-source
//////////////////////////////////////////////////////////////////////////////
router.post('/list-nexl-sources', function (req, res, next) {
	const relativePath = req.body['relativePath'] || path.sep;
	const username = utils.getLoggedInUsername(req);

	if (!security.hasReadPermission(username)) {
		logger.log.error('The [%s] user doesn\'t have read permissions to list nexl sources', username);
		utils.sendError(res, 'No read permissions');
		return;
	}


	return sources.listNexlSources(relativePath).then(data => res.send(data))
		.catch(
			(err) => {
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

	if (!security.hasReadPermission(username)) {
		logger.log.error('The [%s] user doesn\'t have read permissions to load nexl source', username);
		utils.sendError(res, 'No read permissions');
		return;
	}

	return sources.loadNexlSource(relativePath).then(data => res.send(data))
		.catch(
			(err) => {
				logger.log.error('Failed to load a [%s] nexl source for [%s] user. Reason : [%s]', relativePath, username, err);
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

	if (!security.hasWritePermission(username)) {
		logger.log.error('The [%s] user doesn\'t have write permissions to save nexl source items', username);
		utils.sendError(res, 'No write permissions');
		return;
	}

	return sources.saveNexlSource(relativePath, content).then(() => res.send({}))
		.catch(
			(err) => {
				logger.log.error('Failed to save a [%s] nexl source for [%s] user. Reason : [%s]', relativePath, username, err);
				utils.sendError(res, err);
			});
});

router.post('/*', function (req, res, next) {
	utils.sendError(res, 'Service not found', 404);
});

router.get('/*', function (req, res, next) {
	utils.sendError(res, 'Service not found', 404);
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
