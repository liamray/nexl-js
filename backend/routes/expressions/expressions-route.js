const j79 = require('j79-utils');
const queryString = require('querystring');
const url = require('url');
const express = require('express');
const path = require('path');
const router = express.Router();
const nexlEngine = require('nexl-engine');
const logger = require('../../api/logger');
const utils = require('../../api/utils');
const confMgmt = require('../../api/conf-mgmt');
const security = require('../../api/security');
const confConsts = require('../../common/conf-constants');
const diConsts = require('../../common/data-interchange-constants');

const JSONP_FUNC = 'nexl-jsonp-func-name';

function resolveGetParams(req) {
	const expression = req.query.expression;
	delete req.query['expression'];

	// no content in GET request
	return {
		relativePath: queryString.unescape(url.parse(req.url).pathname),
		expression: expression,
		args: req.query
	};
}

function resolvePostParams(req) {
	const expression = req.body.expression;
	delete req.body['expression'];

	const content = req.body[diConsts.FILE_BODY];
	delete req.body[diConsts.FILE_BODY];

	return {
		relativePath: queryString.unescape(req.url),
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

	const fullPath = path.join(confMgmt.getNexlStorageDir(), httpParams.relativePath);
	if (!utils.isFilePathValid(fullPath)) {
		logger.log.error('Got unacceptable path [%s]', fullPath);
		throw 'Unacceptable path ( relative path contains restricted characters )';
	}

	const nexlSource = {
		fileEncoding: confConsts.ENCODING_UTF8,
		basePath: confMgmt.getNexlStorageDir(),
		filePath: fullPath
	};

	// ignoring content for GET method. Altered storage file works only for POST method
	if (httpParams.method.toUpperCase() === 'POST' && httpParams.content !== undefined) {
		nexlSource.fileContent = httpParams.content;
	}

	return {
		nexlSource: nexlSource,
		item: httpParams.expression,
		args: nexlEngine.handleArgs(httpParams.args)
	};
}

function nexlizeInner(httpParams, username) {
	const nexlParams = assembleNexlParams(httpParams);
	if (logger.isLogLevel('verbose')) {
		const source = nexlParams.nexlSource.fileContent ? 'altered nexl source' : nexlParams.nexlSource.filePath;
		const args = JSON.stringify(nexlParams.args || {});
		logger.log.log('verbose', `Evaluating the following nexl [expression=${nexlParams.item}], from the [file=${source}], [arguments=${args}], [method=${httpParams.method}], [clientIP=${httpParams.ip}], [userName=${username}] [url=${httpParams.url}]`);
	}
	return nexlEngine.nexlize(nexlParams.nexlSource, nexlParams.item, nexlParams.args);
}

function makeJsonResponse(req, field, data) {
	const jsonpFuncName = req[JSONP_FUNC];

	let result = {};
	result[field] = data;
	result = JSON.stringify(result);
	return `${jsonpFuncName} ( ${result} )`;
}

function isJSONPSupported(req) {
	return !utils.isEmptyStr(req[JSONP_FUNC]);
}

function sendError(req, res, err, status) {
	if (!isJSONPSupported(req)) {
		security.sendError(res, err + '', status);
		return;
	}

	const jsonPResponse = makeJsonResponse(req, 'error', err);
	res.send(jsonPResponse);
	res.end();
}

function prepareJSONPRequest(req) {
	// JSON works only via HTTP GET
	if (req.method.toUpperCase() !== 'GET') {
		return;
	}

	// is JSONP supported at all ?
	const callbackParam = confMgmt.getCached(confConsts.CONF_FILES.SETTINGS)[confConsts.SETTINGS.JSONP];
	if (utils.isEmptyStr(callbackParam)) {
		return;
	}

	// resolving JSONP function name
	const callbackFuncName = req.query[callbackParam];

	// checking JSONP function name
	if (!utils.isEmptyStr(callbackFuncName)) {
		req[JSONP_FUNC] = callbackFuncName;
		logger.log.debug(`Got JSONP request, function name is [${callbackFuncName}]`);
	}
}

function nexlize(httpParams, req, res) {
	let result;

	httpParams.method = req.method;
	httpParams.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	httpParams.url = req.protocol + '://' + req.get('host') + req.originalUrl;

	const username = security.getLoggedInUsername(req);

	prepareJSONPRequest(req);

	try {
		result = nexlizeInner(httpParams, username);
	} catch (err) {
		logger.log.error(`nexl request rejected for [${username}] user. Reason : [%s]`, utils.formatErr(err));
		sendError(req, res, err, 500);
		return;
	}

	// is undefined ?
	if (result === undefined) {
		logger.log.error(`Got undefined value for [${username}] user`);
		sendError(req, res, 'Got undefined value', 555);
		return;
	}

	// is null ?
	if (result === null) {
		logger.log.error('Got null value');
		sendError(req, res, `Got null value for [${username}] user`, 556);
		return;
	}

	if (isJSONPSupported(req)) {
		const jsonPResponse = makeJsonResponse(req, 'data', result);
		res.send(jsonPResponse);
		res.end();
		logger.log.debug(`nexl expression evaluated by [${username}] user and  JSONP response sent`);
		return;
	}

	// string sends as is. all other must be stringified
	if (j79.isString(result) && confMgmt.getCached(confConsts.CONF_FILES.SETTINGS)[confConsts.SETTINGS.RAW_OUTPUT]) {
		res.header("Content-Type", 'text/plain');
		res.send(result);
	} else {
		res.header("Content-Type", 'application/json');
		res.send(JSON.stringify(result));
	}

	res.end();

	logger.log.debug(`Evaluated nexl expression by [${username}]`);
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
		logger.log.error('The [%s] user doesn\'t have write permissions to evaluate nexl expression on altered file', username);
		security.sendError(res, 'No write permissions to evaluate nexl expression on altered file');
		return;
	}

	nexlize(httpParams, req, res);
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
