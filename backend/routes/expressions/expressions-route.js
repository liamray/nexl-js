const j79 = require('j79-utils');
const url = require('url'); // built-in utility
const express = require('express');
const path = require('path');
const router = express.Router();
const nexlEngine = require('nexl-engine');
const logger = require('../../api/logger');
const utils = require('../../api/utils');
const confMgmt = require('../../api/conf-mgmt');
const security = require('../../api/security');

function resolveGetParams(req) {
	const expression = req.query.expression;
	delete req.query['expression'];

	// no content in GET request
	return {
		relativePath: url.parse(req.url).pathname,
		expression: expression,
		args: req.query
	};
}

function resolvePostParams(req) {
	const expression = req.body.expression;
	delete req.body['expression'];

	const content = req.body['nexl-source-content'];
	delete req.body['nexl-source-content'];

	return {
		relativePath: req.url,
		expression: expression,
		args: req.body,
		content: content
	};
}

function assembleNexlParams(httpParams) {
	if (!j79.isString(httpParams.relativePath)) {
		logger.log.error('[relativePath] is not provided');
		throw '[relativePath] is not provided';
	}

	if (!utils.isFilePathValid(httpParams.relativePath)) {
		logger.log.error('Got unacceptable path [%s]', httpParams.relativePath);
		throw 'Unacceptable path ( relative path contains restricted characters )';
	}

	const fullPath = path.join(confMgmt.getJSFilesRootDir(), httpParams.relativePath);
	if (!utils.isFilePathValid(fullPath)) {
		logger.log.error('Got unacceptable path [%s]', fullPath);
		throw 'Unacceptable path ( relative path contains restricted characters )';
	}

	const nexlSource = {};

	// ignoring content for GET method. Altered nexl js file works only for POST method
	if (httpParams.method.toUpperCase() === 'POST' && httpParams.content !== undefined) {
		nexlSource.asText = {};
		nexlSource.asText['text'] = httpParams.content;
		nexlSource.asText['path4imports'] = path.dirname(fullPath);
	} else {
		nexlSource.asFile = {};
		nexlSource.asFile['fileName'] = fullPath;
	}

	return {
		nexlSource: nexlSource,
		item: httpParams.expression,
		args: nexlEngine.convertStrItems2Obj(httpParams.args)
	};
}

function nexlizeInner(httpParams) {
	const nexlParams = assembleNexlParams(httpParams);
	return nexlEngine.nexlize(nexlParams.nexlSource, nexlParams.item, nexlParams.args);
}

function nexlize(httpParams, req, res) {
	let result;

	httpParams.method = req.method;

	try {
		result = nexlizeInner(httpParams);
	} catch (e) {
		logger.log.error('nexl request rejected. Reason : [%s]', e);
		security.sendError(res, e, 500);
		return;
	}

	// is undefined ?
	if (result === undefined) {
		logger.log.error('Got undefined value');
		security.sendError(res, 'Got undefined value', 555);
		return;
	}

	// is null ?
	if (result === null) {
		logger.log.error('Got null value');
		security.sendError(res, 'Got null value', 556);
		return;
	}

	// setting up headers
	if (j79.isArray(result) || j79.isObject(result)) {
		res.header("Content-Type", 'application/json');
	} else {
		res.header("Content-Type", 'text/plain');
	}

	// string sends as is. all other must be stringified
	if (j79.isString(result)) {
		res.send(result);
	} else {
		res.send(JSON.stringify(result));
	}

	res.end();

	if (logger.isLogLevel('debug')) {
		const username = security.getLoggedInUsername(req);
		logger.log.debug(`Successfully evaluated nexl expression by [${username}]`);
	}
}

router.get('/*', function (req, res) {
	const username = security.getLoggedInUsername(req);

	logger.log.debug(`Going to evaluate nexl expression by [${username}] user ( GET request )`);

	if (!security.hasReadPermission(username)) {
		logger.log.error('The [%s] user doesn\'t have read permissions to evaluate nexl expression', username);
		security.sendError(res, 'No read permissions');
		return;
	}

	// continue nexlizing
	const httpParams = resolveGetParams(req);
	nexlize(httpParams, req, res);
});

router.post('/*', function (req, res) {
	const username = security.getLoggedInUsername(req);

	logger.log.debug(`Going to evaluate nexl expression by [${username}] user ( POST request )`);

	const status = security.status(username);

	if (!status.hasReadPermission) {
		logger.log.error('The [%s] user doesn\'t have read permissions to evaluate nexl expression', username);
		security.sendError(res, 'No read permissions');
		return;
	}

	// continue nexlizing
	const httpParams = resolvePostParams(req);

	if (!status.hasWritePermission && httpParams.content !== undefined) {
		logger.log.error('The [%s] user doesn\'t have write permissions to evaluate nexl expression with altered nexl js file', username);
		security.sendError(res, 'No write permissions to evaluate nexl expression with altered js file');
		return;
	}

	nexlize(httpParams, req, res);
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
