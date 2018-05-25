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

function assembleNexlParams(httpParams, username) {
	// if content set user must have write permissions
	if (httpParams.content !== undefined && !security.hasWritePermission(username)) {
		logger.log.error('The [%s] user doesn\'t have write permissions to evaluate nexl expression with altered nexl source', username);
		utils.sendError('No write permissions');
		return;
	}

	if (!j79.isString(httpParams.relativePath)) {
		logger.log.error('[relativePath] is not provided');
		throw '[relativePath] is not provided';
	}

	if (!utils.isFilePathValid(httpParams.relativePath)) {
		logger.log.error('Got unacceptable path [%s]', httpParams.relativePath);
		throw 'Unacceptable path ( relative path contains restricted characters )';
	}

	const fullPath = path.join(confMgmt.getNexlSourcesDir(), httpParams.relativePath);
	if (!utils.isFilePathValid(fullPath)) {
		logger.log.error('Got unacceptable path [%s]', fullPath);
		throw 'Unacceptable path ( relative path contains restricted characters )';
	}

	let nexlSource = {};

	if (httpParams.content === undefined) {
		nexlSource.asFile = {};
		nexlSource.asFile['fileName'] = fullPath;
	} else {
		nexlSource.asText = {};
		nexlSource.asText['text'] = httpParams.content;
		nexlSource.asText['path4imports'] = path.dirname(fullPath);
	}

	return {
		nexlSource: nexlSource,
		item: httpParams.expression,
		args: httpParams.args
	};
}

function nexlizeInner(httpParams, username) {
	const nexlParams = assembleNexlParams(httpParams, username);
	return nexlEngine.nexlize(nexlParams.nexlSource, nexlParams.item, nexlParams.args);
}

function nexlize(httpParams, req, res) {
	const username = utils.getLoggedInUsername(req);
	logger.log.debug('Evaluating nexl expression for [%s] user', username);

	// user must have at least read permissions
	if (!security.hasReadPermission(username)) {
		logger.log.error('The [%s] user doesn\'t have read permissions to evaluate nexl expression', username);
		utils.sendError('No read permissions');
		return;
	}

	let result;

	try {
		result = nexlizeInner(httpParams, username);
	} catch (e) {
		logger.log.error('nexl request rejected. Reason : [%s]', e);
		utils.sendError(res, e, 500);
		return;
	}

	// is undefined ?
	if (result === undefined) {
		logger.log.error('Got undefined value');
		utils.sendError(res, 'Got undefined value', 555);
		return;
	}

	// is null ?
	if (result === null) {
		logger.log.error('Got null value');
		utils.sendError(res, 'Got null value', 556);
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
}

router.get('/*', function (req, res) {
	const httpParams = resolveGetParams(req);
	nexlize(httpParams, req, res);
});

router.post('/*', function (req, res) {
	const httpParams = resolvePostParams(req);
	nexlize(httpParams, req, res);
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
