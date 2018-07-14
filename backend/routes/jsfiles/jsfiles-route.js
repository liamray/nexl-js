const express = require('express');
const path = require('path');
const j79 = require('j79-utils');

const jsfilesUtils = require('../../api/jsfiles-utils');
const utils = require('../../api/utils');
const security = require('../../api/security');
const logger = require('../../api/logger');
const fsx = require('../../api/fsx');

const router = express.Router();

//////////////////////////////////////////////////////////////////////////////
// move item
//////////////////////////////////////////////////////////////////////////////
router.post('/move', function (req, res) {
	const username = utils.getLoggedInUsername(req);
	const source = req.body['source'];
	const dest = req.body['dest'];

	logger.log.debug(`Moving a [${source}] item to [${dest}] by [${username}] user`);

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

	if (!security.hasWritePermission(username)) {
		logger.log.error('The [%s] user doesn\'t have write permissions to move items', username);
		utils.sendError(res, 'No write permissions');
		return;
	}

	return jsfilesUtils.move(source, dest)
		.then(_ => {
			res.send({});
			logger.log.debug(`Successfully moved a [${source}] item to [${dest}] by [${username}] user`);
		})
		.catch(
			(err) => {
				logger.log.error('Failed to move a [%s] file to [%s] for [%s] user. Reason : [%s]', source, dest, username, err);
				utils.sendError(res, err);
			});
});

//////////////////////////////////////////////////////////////////////////////
// rename item
//////////////////////////////////////////////////////////////////////////////
router.post('/rename', function (req, res) {
	const username = utils.getLoggedInUsername(req);
	const relativePath = req.body['relativePath'];
	const newRelativePath = req.body['newRelativePath'];

	logger.log.debug(`Renaming a [${relativePath}] item to [${newRelativePath}] by [${username}] user`);

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

	if (!security.hasWritePermission(username)) {
		logger.log.error('The [%s] user doesn\'t have write permissions to rename items', username);
		utils.sendError(res, 'No write permissions');
		return;
	}

	return jsfilesUtils.rename(relativePath, newRelativePath)
		.then(_ => {
			res.send({});
			logger.log.debug(`Successfully renamed a [${relativePath}] item to [${newRelativePath}] by [${username}] user`);
		})
		.catch(
			(err) => {
				logger.log.error('Failed to rename a [%s] file to [%s] for [%s] user. Reason : [%s]', relativePath, newRelativePath, username, err);
				utils.sendError(res, err);
			});
});

//////////////////////////////////////////////////////////////////////////////
// delete item
//////////////////////////////////////////////////////////////////////////////
router.post('/delete', function (req, res) {
	const username = utils.getLoggedInUsername(req);
	const relativePath = req.body['relativePath'];

	logger.log.debug(`Deleting a [${relativePath}] item by [${username}] user`);

	// validating ( must not empty string )
	if (!j79.isString(relativePath) || relativePath.length < 1) {
		logger.log.error('Invalid relativePath');
		utils.sendError(res, 'Invalid relativePath');
		return;
	}

	if (!security.hasWritePermission(username)) {
		logger.log.error('The [%s] user doesn\'t have write permissions to delete items', username);
		utils.sendError(res, 'No write permissions');
		return;
	}

	return jsfilesUtils.deleteItem(relativePath)
		.then(_ => {
			res.send({});
			logger.log.debug(`Successfully deleted a [${relativePath}] item by [${username}] user`);
		})
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
	const username = utils.getLoggedInUsername(req);
	const relativePath = req.body['relativePath'];

	logger.log.debug(`Creating a [${relativePath}] directory by [${username}] user`);

	// validating ( must not empty string )
	if (!j79.isString(relativePath) || relativePath.length < 1) {
		logger.log.error('Invalid relativePath');
		utils.sendError(res, 'Invalid relativePath');
		return;
	}

	if (!security.hasWritePermission(username)) {
		logger.log.error('The [%s] user doesn\'t have write permissions to create new directory', username);
		utils.sendError(res, 'No write permissions');
		return;
	}

	return jsfilesUtils.mkdir(relativePath)
		.then(_ => {
			res.send({});
			logger.log.debug(`Successfully created a [${relativePath}] directory by [${username}] user`);
		})
		.catch(
			(err) => {
				logger.log.error('Failed to create a [%s] directory for [%s] user. Reason : [%s]', relativePath, username, err);
				utils.sendError(res, err);
			});
});

//////////////////////////////////////////////////////////////////////////////
// list-jsfiles
//////////////////////////////////////////////////////////////////////////////
router.post('/list-jsfiles', function (req, res, next) {
	const username = utils.getLoggedInUsername(req);
	const relativePath = req.body['relativePath'] || path.sep;

	logger.log.debug(`Listing JavaScript files in [${relativePath}] directory by [${username}] user`);

	if (!security.hasReadPermission(username)) {
		logger.log.error('The [%s] user doesn\'t have read permissions to list nexl JavaScript files', username);
		utils.sendError(res, 'No read permissions');
		return;
	}

	res.send(jsfilesUtils.getTreeItems());
});

//////////////////////////////////////////////////////////////////////////////
// load-jsfile
//////////////////////////////////////////////////////////////////////////////
router.post('/load-jsfile', function (req, res, next) {
	const username = utils.getLoggedInUsername(req);
	const relativePath = req.body['relativePath'] || path.sep;

	logger.log.debug(`Loading content of [${relativePath}] JavaScript file by [${username}] user`);

	if (!security.hasReadPermission(username)) {
		logger.log.error('The [%s] user doesn\'t have read permissions to load JavaScript files', username);
		utils.sendError(res, 'No read permissions');
		return;
	}

	return jsfilesUtils.loadJSFile(relativePath)
		.then(data => {
			res.send(data);
			logger.log.debug(`Successfully loaded content of [${relativePath}] JavaScript file by [${username}] user`);
		})
		.catch(
			(err) => {
				logger.log.error('Failed to load a [%s] nexl JavaScript file for [%s] user. Reason : [%s]', relativePath, username, err);
				utils.sendError(res, err);
			});
});

//////////////////////////////////////////////////////////////////////////////
// save-jsfile
//////////////////////////////////////////////////////////////////////////////
router.post('/save-jsfile', function (req, res, next) {
	const username = utils.getLoggedInUsername(req);
	const relativePath = req.body['relativePath'];
	const content = req.body['content'];

	logger.log.debug(`Saving content of [${relativePath}] JavaScript file by [${username}] user`);

	// validating ( must not empty string )
	if (!j79.isString(relativePath) || relativePath.length < 1) {
		logger.log.error('Invalid relativePath');
		utils.sendError(res, 'Invalid relativePath');
		return;
	}


	if (!security.hasWritePermission(username)) {
		logger.log.error('The [%s] user doesn\'t have write permissions to save nexl JavaScript file', username);
		utils.sendError(res, 'No write permissions');
		return;
	}

	return jsfilesUtils.saveJSFile(relativePath, content)
		.then(() => {
			res.send({});
			logger.log.debug(`Successfully saved content of [${relativePath}] JavaScript file by [${username}] user`);
		})
		.catch(
			(err) => {
				logger.log.error('Failed to save a [%s] nexl JavaScript file for [%s] user. Reason : [%s]', relativePath, username, err);
				utils.sendError(res, err);
			});
});

router.post('/*', function (req, res) {
	logger.log.error(`Unknown route [${req.baseUrl}]`);
	utils.sendError(res, `Unknown route`, 404);
});

router.get('/*', function (req, res) {
	logger.log.error(`Unknown route [${req.baseUrl}]`);
	utils.sendError(res, `Unknown route`, 404);
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
