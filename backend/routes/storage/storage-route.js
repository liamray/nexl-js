const express = require('express');
const path = require('path');
const j79 = require('j79-utils');

const storageUtils = require('../../api/storage-utils');
const security = require('../../api/security');
const logger = require('../../api/logger');
const restUtls = require('../../common/rest-urls');
const di = require('../../common/data-interchange-constants');

const router = express.Router();

//////////////////////////////////////////////////////////////////////////////
// find file
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.STORAGE.URLS.FILE_IN_FILES, function (req, res) {
	const username = security.getLoggedInUsername(req);

	const relativePath = req.body[di.RELATIVE_PATH];
	const text = req.body[di.TEXT];
	const matchCase = req.body[di.MATCH_CASE];
	const isRegex = req.body[di.IS_REGEX];

	logger.log.debug(`Searching for a [${text}] string from the [${relativePath}] path`);

	// todo : automate validations !!!
	// todo : automate validations !!!
	// todo : automate validations !!!

	// validating relativePath
	if (!j79.isString(relativePath) || relativePath.text < 1) {
		logger.log.error(`The [${di.RELATIVE_PATH}] must be a valid non empty string`);
		security.sendError(res, `The [${di.RELATIVE_PATH}] must be a valid non empty string`);
		return;
	}

	// validating text
	if (!j79.isString(text) || text.text < 1) {
		logger.log.error('Empty text is not allowed');
		security.sendError(res, 'Empty text is not allowed');
		return;
	}

	// validating matchCase
	if (!j79.isBool(matchCase)) {
		logger.log.error(`The [${di.MATCH_CASE}] must be of a boolean type`);
		security.sendError(res, `The [${di.MATCH_CASE}] must be of a boolean type`);
		return;
	}

	// validating isRegex
	if (!j79.isBool(matchCase)) {
		logger.log.error(`The [${di.IS_REGEX}] must be of a boolean type`);
		security.sendError(res, `The [${di.IS_REGEX}] must be of a boolean type`);
		return;
	}

	if (!security.hasReadPermission(username)) {
		logger.log.error('The [%s] user doesn\'t have write permissions to search text in files', username);
		security.sendError(res, 'No read permissions');
		return;
	}

	const data = {};
	data[di.RELATIVE_PATH] = relativePath;
	data[di.TEXT] = text;
	data[di.MATCH_CASE] = matchCase;
	data[di.IS_REGEX] = isRegex;

	storageUtils.findInFiles(data).then(
		result => res.send({result: result})
	);
});

//////////////////////////////////////////////////////////////////////////////
// move item
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.STORAGE.URLS.MOVE, function (req, res) {
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

	return storageUtils.move(source, dest)
		.then(_ => {
			res.send({});
			logger.log.log('verbose', `Moved a [${source}] item to [${dest}] by [${username}] user`);
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
router.post(restUtls.STORAGE.URLS.RENAME, function (req, res) {
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

	return storageUtils.rename(relativePath, newRelativePath)
		.then(_ => {
			res.send({});
			logger.log.log('verbose', `Renamed a [${relativePath}] item to [${newRelativePath}] by [${username}] user`);
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
router.post(restUtls.STORAGE.URLS.DELETE, function (req, res) {
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

	return storageUtils.deleteItem(relativePath)
		.then(_ => {
			res.send({});
			logger.log.log('verbose', `Deleted a [${relativePath}] item by [${username}] user`);
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
router.post(restUtls.STORAGE.URLS.MAKE_DIR, function (req, res, next) {
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

	return storageUtils.mkdir(relativePath)
		.then(_ => {
			res.send({});
			logger.log.log('verbose', `Created a [${relativePath}] directory by [${username}] user`);
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
router.post(restUtls.STORAGE.URLS.TREE_ITEMS, function (req, res, next) {
	const username = security.getLoggedInUsername(req);

	logger.log.debug(`Getting tree items hierarchy by [${username}] user`);

	if (!security.hasReadPermission(username)) {
		logger.log.error('The [%s] user doesn\'t have read permissions to get tree items hierarchy', username);
		security.sendError(res, 'No read permissions');
		return;
	}

	res.send(storageUtils.getTreeItems());
});

//////////////////////////////////////////////////////////////////////////////
// load file from storage
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.STORAGE.URLS.LOAD_FILE_FROM_STORAGE, function (req, res, next) {
	const username = security.getLoggedInUsername(req);
	const relativePath = req.body['relativePath'] || path.sep;

	logger.log.debug(`Loading content of [${relativePath}] JavaScript file by [${username}] user`);

	if (!security.hasReadPermission(username)) {
		logger.log.error('The [%s] user doesn\'t have read permissions to load JavaScript files', username);
		security.sendError(res, 'No read permissions');
		return;
	}

	const currentTime = new Date().getTime();

	return storageUtils.loadFileFromStorage(relativePath)
		.then(data => {
			const body = {};
			body[di.FILE_BODY] = data;
			body[di.FILE_LOAD_TIME] = currentTime;
			res.send(body);
			logger.log.debug(`Loaded content of [${relativePath}] JavaScript file by [${username}] user`);
		})
		.catch(
			(err) => {
				logger.log.error('Failed to load a [%s] nexl JavaScript file for [%s] user. Reason : [%s]', relativePath, username, err);
				security.sendError(res, err);
			});
});

//////////////////////////////////////////////////////////////////////////////
// save file to storage
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.STORAGE.URLS.SAVE_FILE_TO_STORAGE, function (req, res, next) {
	const username = security.getLoggedInUsername(req);
	const relativePath = req.body['relativePath'];
	const content = req.body['content'];
	const fileLoadTime = req.body[di.FILE_LOAD_TIME];

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

	return storageUtils.saveFileToStorage(relativePath, content, fileLoadTime)
		.then(result => {
			res.send(result);
			logger.log.log('verbose', `The [${relativePath}] file is saved by [${username}] user`);
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
