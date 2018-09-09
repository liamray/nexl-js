const express = require('express');
const path = require('path');
const j79 = require('j79-utils');

const jsfilesUtils = require('../../api/jsfiles-utils');
const utils = require('../../api/utils');
const security = require('../../api/security');
const logger = require('../../api/logger');
const restUtls = require('../../common/rest-urls');

const router = express.Router();

//////////////////////////////////////////////////////////////////////////////
// move item
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.JS_FILES.URLS.MOVE, function (req, res) {
	const username = security.getLoggedInUsername(req);
	const source = req.body['source'];
	const dest = req.body['dest'];

	logger.log.debug(`Moving a [${source}] item to [${dest}] by [${username}] user`);

	// validating ( must not empty string )
	if (!j79.isString(source) || source.length < 1) {
		logger.log.error('Invalid source item');
		security.sendError(res, 'Invalid source item');
		return;
	}

	// validating
	if (!j79.isString(dest)) {
		logger.log.error('Invalid dest item');
		security.sendError(res, 'Invalid dest item');
		return;
	}

	if (!security.hasWritePermission(username)) {
		logger.log.error('The [%s] user doesn\'t have write permissions to move items', username);
		security.sendError(res, 'No write permissions');
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
				security.sendError(res, err);
			});
});

//////////////////////////////////////////////////////////////////////////////
// rename item
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.JS_FILES.URLS.RENAME, function (req, res) {
	const username = security.getLoggedInUsername(req);
	const relativePath = req.body['relativePath'];
	const newRelativePath = req.body['newRelativePath'];

	logger.log.debug(`Renaming a [${relativePath}] item to [${newRelativePath}] by [${username}] user`);

	// validating ( must not empty string )
	if (!j79.isString(relativePath) || relativePath.length < 1) {
		logger.log.error('Invalid relativePath');
		security.sendError(res, 'Invalid relativePath');
		return;
	}

	// validating ( must not empty string )
	if (!j79.isString(newRelativePath) || newRelativePath.length < 1) {
		logger.log.error('Invalid newRelativePath');
		security.sendError(res, 'Invalid newRelativePath');
		return;
	}

	if (!security.hasWritePermission(username)) {
		logger.log.error('The [%s] user doesn\'t have write permissions to rename items', username);
		security.sendError(res, 'No write permissions');
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
				security.sendError(res, err);
			});
});

//////////////////////////////////////////////////////////////////////////////
// delete item
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.JS_FILES.URLS.DELETE, function (req, res) {
	const username = security.getLoggedInUsername(req);
	const relativePath = req.body['relativePath'];

	logger.log.debug(`Deleting a [${relativePath}] item by [${username}] user`);

	// validating ( must not empty string )
	if (!j79.isString(relativePath) || relativePath.length < 1) {
		logger.log.error('Invalid relativePath');
		security.sendError(res, 'Invalid relativePath');
		return;
	}

	if (!security.hasWritePermission(username)) {
		logger.log.error('The [%s] user doesn\'t have write permissions to delete items', username);
		security.sendError(res, 'No write permissions');
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
				security.sendError(res, err);
			});
});

//////////////////////////////////////////////////////////////////////////////
// make-dir
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.JS_FILES.URLS.MAKE_DIR, function (req, res, next) {
	const username = security.getLoggedInUsername(req);
	const relativePath = req.body['relativePath'];

	logger.log.debug(`Creating a [${relativePath}] directory by [${username}] user`);

	// validating ( must not empty string )
	if (!j79.isString(relativePath) || relativePath.length < 1) {
		logger.log.error('Invalid relativePath');
		security.sendError(res, 'Invalid relativePath');
		return;
	}

	if (!security.hasWritePermission(username)) {
		logger.log.error('The [%s] user doesn\'t have write permissions to create new directory', username);
		security.sendError(res, 'No write permissions');
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
				security.sendError(res, err);
			});
});

//////////////////////////////////////////////////////////////////////////////
// get tree items hierarchy
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.JS_FILES.URLS.TREE_ITEMS, function (req, res, next) {
	const username = security.getLoggedInUsername(req);

	logger.log.debug(`Getting tree items hierarchy by [${username}] user`);

	if (!security.hasReadPermission(username)) {
		logger.log.error('The [%s] user doesn\'t have read permissions to get tree items hierarchy', username);
		security.sendError(res, 'No read permissions');
		return;
	}

	res.send(jsfilesUtils.getTreeItems());
});

//////////////////////////////////////////////////////////////////////////////
// load-jsfile
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.JS_FILES.URLS.LOAD_JS_FILE, function (req, res, next) {
	const username = security.getLoggedInUsername(req);
	const relativePath = req.body['relativePath'] || path.sep;

	logger.log.debug(`Loading content of [${relativePath}] JavaScript file by [${username}] user`);

	if (!security.hasReadPermission(username)) {
		logger.log.error('The [%s] user doesn\'t have read permissions to load JavaScript files', username);
		security.sendError(res, 'No read permissions');
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
				security.sendError(res, err);
			});
});

//////////////////////////////////////////////////////////////////////////////
// save-jsfile
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.JS_FILES.URLS.SAVE_JS_FILE, function (req, res, next) {
	const username = security.getLoggedInUsername(req);
	const relativePath = req.body['relativePath'];
	const content = req.body['content'];
	const fileLoadTime = req.body['file-load-time'];

	logger.log.debug(`Saving content of [${relativePath}] JavaScript file by [${username}] user. fileLoadTime is [${fileLoadTime}]`);

	// validating ( must not empty string )
	if (!j79.isString(relativePath) || relativePath.length < 1) {
		logger.log.error('Invalid relativePath');
		security.sendError(res, 'Invalid relativePath');
		return;
	}


	if (!security.hasWritePermission(username)) {
		logger.log.error('The [%s] user doesn\'t have write permissions to save nexl JavaScript file', username);
		security.sendError(res, 'No write permissions');
		return;
	}

	return jsfilesUtils.saveJSFile(relativePath, content, fileLoadTime)
		.then(result => {
			res.send(result);
			logger.log.debug(`Successfully saved content of [${relativePath}] JavaScript file by [${username}] user`);
		})
		.catch(
			(err) => {
				logger.log.error('Failed to save a [%s] nexl JavaScript file for [%s] user. Reason : [%s]', relativePath, username, err);
				security.sendError(res, err);
			});
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
