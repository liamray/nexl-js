const express = require('express');
const path = require('path');
const j79 = require('j79-utils');
const nexlEngine = require('nexl-engine');

const storageUtils = require('../../api/storage-utils');
const security = require('../../api/security');
const utils = require('../../api/utils');
const logger = require('../../api/logger');
const restUtls = require('../../common/rest-urls');
const di = require('../../common/data-interchange-constants');
const confMgmt = require('../../api/conf-mgmt');
const confConsts = require('../../common/conf-constants');
const diConsts = require('../../common/data-interchange-constants');

const router = express.Router();

//////////////////////////////////////////////////////////////////////////////
//  [/nexl/storage/set-var]
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.STORAGE.URLS.SET_VAR, function (req, res) {
	// checking for permissions
	const username = security.getLoggedInUsername(req);
	if (!security.hasWritePermission(username)) {
		logger.log.error('The [%s] user doesn\'t have write permission to update JavaScript files', username);
		security.sendError(res, 'No write permissions');
		return;
	}

	// resolving params
	const relativePath = req.body['relativePath'];
	const varName = req.body['varName'];
	const newValue = req.body['newValue'];

	logger.log.log('verbose', `Got a [${restUtls.STORAGE.URLS.SET_VAR}] request from the [${username}] user for [relativePath=${relativePath}] and [varName=${varName}]`);

	// validating relativePath
	if (!relativePath) {
		logger.log.error(`The [relativePath] is not provided for [${restUtls.STORAGE.URLS.SET_VAR}] URL. Requested by [${username}]`);
		security.sendError(res, 'The [relativePath] is not provided');
		return;
	}

	// validating varName
	if (!varName) {
		logger.log.error(`The [varName] is not provided for [${restUtls.STORAGE.URLS.SET_VAR}] URL. Requested by [${username}]`);
		security.sendError(res, 'The [varName] is not provided');
		return;
	}

	// validating newValue
	if (!newValue) {
		logger.log.error(`The [newValue] is not provided for [${restUtls.STORAGE.URLS.SET_VAR}] URL. Requested by [${username}]`);
		security.sendError(res, 'The [newValue] is not provided');
		return;
	}

	return storageUtils.setVar(relativePath, varName, newValue)
		.then(_ => {
			res.send({});
			logger.log.debug(`Updated a [varName=${varName}] in the [relativePath=${relativePath}] JavaScript file by [username=${username}]`);
		})
		.catch(
			(err) => {
				logger.log.error(`Failed to update a [varName=${varName}] in the [relativePath=${relativePath}] JavaScript file by [username=${username}]. Reason: [${ utils.formatErr(err)}]`);
				security.sendError(res, 'Failed to update a JavaScript var');
			});
});


//////////////////////////////////////////////////////////////////////////////
// md
//////////////////////////////////////////////////////////////////////////////
function md2Expressions(md) {
	const opRegex = new RegExp(`([${nexlEngine.OPERATIONS_ESCAPED}])`, 'g');
	const result = [];
	md.forEach(item => {
		if (item.type === 'Function') {
			const args = item.args.length < 1 ? '' : `${item.args.join('|')}|`;
			result.push(`\${${args}${item.name}()}`);
			return;
		}

		result.push(`\${${item.name}}`);

		if (item.type === 'Object' && item.keys) {
			item.keys.forEach(key => {
				const keyEscaped = key.replace(opRegex, '\\$1');
				result.push(`\${${item.name}.${keyEscaped}}`);
			});
		}
	});
	return result;
}

router.post(restUtls.STORAGE.URLS.METADATA, function (req, res) {
	const username = security.getLoggedInUsername(req);
	const relativePath = req.body['relativePath'] || path.sep;

	logger.log.log('verbose', `Got a [${restUtls.STORAGE.URLS.METADATA}] request from the [${username}] user for [relativePath=${relativePath}]`);

	if (!security.hasReadPermission(username)) {
		logger.log.error('The [%s] user doesn\'t have read permissions to load metadata', username);
		security.sendError(res, 'No read permissions');
		return;
	}

	const fullPath = path.join(confMgmt.getNexlStorageDir(), relativePath);
	if (!utils.isFilePathValid(fullPath)) {
		logger.log.error(`The [relativePath=${relativePath}] is unacceptable, requested by [user=${username}]`);
		security.sendError(res, 'Unacceptable path');
		return;
	}

	const nexlSource = {
		fileEncoding: confConsts.ENCODING_UTF8,
		basePath: confMgmt.getNexlStorageDir(),
		filePath: fullPath,
		fileContent: req.body[diConsts.FILE_BODY]
	};

	// resolving metadata for [relativePath]
	let md;
	try {
		md = nexlEngine.parseMD(nexlSource);
	} catch (e) {
		logger.log.error(`Failed to parse a [relativePath=${relativePath}] file. Requested by [user=${username}]. [reason=${utils.formatErr(e)}]`);
		security.sendError(res, 'Failed to parse a file');
		return;
	}

	res.send({
		md: md2Expressions(md)
	});
});

//////////////////////////////////////////////////////////////////////////////
// reindex files
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.STORAGE.URLS.REINDEX_FILES, function (req, res) {
	const username = security.getLoggedInUsername(req);

	logger.log.log('verbose', `Got a [${restUtls.STORAGE.URLS.REINDEX_FILES}] request`);

	if (!security.isAdmin(username)) {
		logger.log.error('Cannot reindex file because the [%s] user doesn\'t have admin permissions', username);
		security.sendError(res, 'admin permissions required');
		return;
	}

	storageUtils.cacheStorageFiles()
		.then(result => res.send({}))
		.catch(err => {
			logger.log.error(`Failed to reindex files. Reason: [${utils.formatErr(err)}]`);
			security.sendError(res, 'Failed to reindex');
		});
});

//////////////////////////////////////////////////////////////////////////////
// find file
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.STORAGE.URLS.FILE_IN_FILES, function (req, res) {
	const username = security.getLoggedInUsername(req);

	const relativePath = req.body[di.RELATIVE_PATH];
	const text = req.body[di.TEXT];
	const matchCase = req.body[di.MATCH_CASE];
	const isRegex = req.body[di.IS_REGEX];

	logger.log.log('verbose', `Got a [${restUtls.STORAGE.URLS.FILE_IN_FILES}] request from the [${username}] user for [relativePath=${relativePath}] [text=${text}] [matchCase=${matchCase}] [isRegex=${isRegex}]`);

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
	if (!j79.isString(text) || text.length < 1) {
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
	).catch(err => {
		logger.log.error(`Find in files failed. Reason: [${utils.formatErr(err)}]`);
		security.sendError(res, 'Find in files failed');
	});
});

//////////////////////////////////////////////////////////////////////////////
// move item
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.STORAGE.URLS.MOVE, function (req, res) {
	const username = security.getLoggedInUsername(req);
	const source = req.body['source'];
	const dest = req.body['dest'];

	logger.log.log('verbose', `Got a [${restUtls.STORAGE.URLS.MOVE}] request from the [${username}] user for [source=${source}] [dest=${dest}]`);

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
				logger.log.error('Failed to move a [%s] file to [%s] for [%s] user. Reason : [%s]', source, dest, username, utils.formatErr(err));
				security.sendError(res, 'Failed to move item');
			});
});

//////////////////////////////////////////////////////////////////////////////
// rename item
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.STORAGE.URLS.RENAME, function (req, res) {
	const username = security.getLoggedInUsername(req);
	const relativePath = req.body['relativePath'];
	const newRelativePath = req.body['newRelativePath'];

	logger.log.log('verbose', `Got a [${restUtls.STORAGE.URLS.RENAME}] request from the [${username}] user for [relativePath=${relativePath}] [newRelativePath=${newRelativePath}]`);

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
				logger.log.error('Failed to rename a [%s] file to [%s] for [%s] user. Reason : [%s]', relativePath, newRelativePath, username, utils.formatErr(err));
				security.sendError(res, 'Failed to rename item');
			});
});

//////////////////////////////////////////////////////////////////////////////
// delete item
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.STORAGE.URLS.DELETE, function (req, res) {
	const username = security.getLoggedInUsername(req);
	const relativePath = req.body['relativePath'];

	logger.log.log('verbose', `Got a [${restUtls.STORAGE.URLS.DELETE}] request from the [${username}] user for [relativePath=${relativePath}]`);

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
				logger.log.error('Failed to delete a [%s] item for [%s] user. Reason : [%s]', relativePath, username, utils.formatErr(err));
				security.sendError(res, 'Failed to delete item');
			});
});

//////////////////////////////////////////////////////////////////////////////
// make-dir
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.STORAGE.URLS.MAKE_DIR, function (req, res, next) {
	const username = security.getLoggedInUsername(req);
	const relativePath = req.body['relativePath'];

	logger.log.log('verbose', `Got a [${restUtls.STORAGE.URLS.MAKE_DIR}] request from the [${username}] user for [relativePath=${relativePath}]`);

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
				logger.log.error('Failed to create a [%s] directory for [%s] user. Reason : [%s]', relativePath, username, utils.formatErr(err));
				security.sendError(res, 'Failed to create a directory');
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
// list-dirs, list-files, list-files-and-dirs
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.STORAGE.URLS.LIST_FILES, function (req, res, next) {
	const username = security.getLoggedInUsername(req);
	const relativePath = req.body[di.RELATIVE_PATH];

	logger.log.log('verbose', `Got a [${restUtls.STORAGE.URLS.LIST_FILES}] request from the [${username}] user for [relativePath=${relativePath}]`);

	if (!security.hasReadPermission(username)) {
		logger.log.error('The [%s] user doesn\'t have read permissions to get tree items hierarchy', username);
		security.sendError(res, 'No read permissions');
		return;
	}


	res.send(storageUtils.listFiles(relativePath));
});

router.post(restUtls.STORAGE.URLS.LIST_DIRS, function (req, res, next) {
	const username = security.getLoggedInUsername(req);
	const relativePath = req.body[di.RELATIVE_PATH];

	logger.log.log('verbose', `Got a [${restUtls.STORAGE.URLS.LIST_DIRS}] request from the [${username}] user for [relativePath=${relativePath}]`);

	if (!security.hasReadPermission(username)) {
		logger.log.error('The [%s] user doesn\'t have read permissions to get tree items hierarchy', username);
		security.sendError(res, 'No read permissions');
		return;
	}


	res.send(storageUtils.listDirs(relativePath));
});

router.post(restUtls.STORAGE.URLS.LIST_FILES_AND_DIRS, function (req, res, next) {
	const username = security.getLoggedInUsername(req);
	const relativePath = req.body[di.RELATIVE_PATH];

	logger.log.log('verbose', `Got a [${restUtls.STORAGE.URLS.LIST_FILES_AND_DIRS}] request from the [${username}] user for [relativePath=${relativePath}]`);

	if (!security.hasReadPermission(username)) {
		logger.log.error('The [%s] user doesn\'t have read permissions to get tree items hierarchy', username);
		security.sendError(res, 'No read permissions');
		return;
	}


	res.send(storageUtils.listDirsAndFiles(relativePath));
});

//////////////////////////////////////////////////////////////////////////////
// load file from storage
//////////////////////////////////////////////////////////////////////////////
router.post(restUtls.STORAGE.URLS.LOAD_FILE_FROM_STORAGE, function (req, res, next) {
	const username = security.getLoggedInUsername(req);
	const relativePath = req.body['relativePath'] || path.sep;

	logger.log.log('verbose', `Got a [${restUtls.STORAGE.URLS.LOAD_FILE_FROM_STORAGE}] request from the [${username}] user for [relativePath=${relativePath}]`);

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
				logger.log.error('Failed to load a [%s] nexl JavaScript file for [%s] user. Reason : [%s]', relativePath, username, utils.formatErr(err));
				security.sendError(res, 'Failed to load file');
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

	logger.log.log('verbose', `Got a [${restUtls.STORAGE.URLS.SAVE_FILE_TO_STORAGE}] request from the [${username}] user for [relativePath=${relativePath}] [content=***not logging***] [fileLoadTime=${fileLoadTime}]`);

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
				logger.log.error('Failed to save a [%s] nexl JavaScript file for [%s] user. Reason : [%s]', relativePath, username, utils.formatErr(err));
				security.sendError(res, 'Failed to save file');
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
