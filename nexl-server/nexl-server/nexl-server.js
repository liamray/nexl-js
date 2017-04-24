/**************************************************************************************
 nexl-server

 Copyright (c) 2016 Yevgeny Sergeyev
 License : Apache 2.0
 WebSite : http://www.nexl-js.com

 JavaScript based read only configuration data storage where every single data element is a javascript variable
 **************************************************************************************/

// include
const nexlEngine = require('nexl-engine');
const j79 = require('j79-utils');
const path = require('path');
const bodyParser = require('body-parser');
const util = require('util');
const express = require('express');
const app = express();
const osHomeDir = require('os-homedir');
const favicon = require('serve-favicon');
const figlet = require('figlet');
const fs = require('fs');
const winston = j79.winston;
const nexlServerUtils = require('./nexl-server-utils');
const version = require('./../package.json').version;

const NEXL_REST_URL = '/nexl-rest';
const REST_LIST_SOURCES = NEXL_REST_URL + '/list-nexl-sources';
const REST_LIST_JS_VARIABLES = NEXL_REST_URL + '/list-js-variables';
const DEFAULT_NEXL_SOURCES_DIR = 'nexl-sources';


var NEXL_SOURCES_ROOT;
var server;

function resolveNexlSourcesDir() {
	// resolving nexl-source dir from command line arguments
	NEXL_SOURCES_ROOT = nexlServerUtils.cmdLineOpts.Main['nexl-sources'];

	// if not provided use a OS home dir + nexl-sources
	if (!NEXL_SOURCES_ROOT) {
		NEXL_SOURCES_ROOT = path.join(osHomeDir(), DEFAULT_NEXL_SOURCES_DIR);
	}

	// print error if nexl-sources directory doesn't exist
	fs.exists(NEXL_SOURCES_ROOT, function (result) {
		if (!result) {
			winston.error("nexl sources directory [%s] doesn't exist ! But you can still create it without server restart", NEXL_SOURCES_ROOT);
		}
	});

	winston.info('nexl sources directory is [%s]', NEXL_SOURCES_ROOT);
}

function throwError(e, res) {
	res.status(500);
	res.write(e.toString());
	res.end();
	throw e;
}

function retrieveHttpSource(req, res) {
	if (req.method.toUpperCase() == "GET") {
		return req.query;
	}

	if (req.method.toUpperCase() == "POST") {
		return req.body;
	}

	throwError("Unsupported HTTP-method = [" + req.method + "]", res);
}

function enumerateFiles(dir, collection) {
	var fileItems = [];
	var dirItems = [];

	var items = fs.readdirSync(dir);
	for (var key in  items) {
		var item = items[key];
		var subPath = path.join(dir, item);
		var stat = fs.statSync(subPath);

		if (stat.isDirectory()) {
			var dirItem = {};
			dirItem.text = item;
			dirItem.type = 'dir';
			dirItem.children = enumerateFiles(subPath);
			dirItems.push(dirItem);
		}

		if (stat.isFile()) {
			var fileItem = {};
			fileItem.text = item;
			fileItem.type = 'file';
			fileItem.icon = "jstree-file";
			fileItems.push(fileItem);
		}
	}

	return dirItems.concat(fileItems);
}

function isJsonP(input) {
	return input.callback !== undefined;
}

function makeJsonResult(field, input, data) {
	var result = {};
	result[field] = data;
	return util.format('%s ( %s )', input.callback, JSON.stringify(result));
}

function sendException(err, input, res) {
	err = err.toString();

	if (!isJsonP(input)) {
		res.status(500).write(err);
		return;
	}

	var jsonPResult = makeJsonResult('error', input, err);
	res.write(jsonPResult);
}

// resolves files list under nexl-sources directory
function listNexlSources(req, res) {
	var input = retrieveHttpSource(req, res);

	try {
		var result = enumerateFiles(NEXL_SOURCES_ROOT);
	} catch (e) {
		sendException(e, input, res);
		res.end();
		return;
	}

	// is jsonp ?
	if (isJsonP(input)) {
		sendJsonPResult(result, input, res);
	} else {
		res.json(result);
	}

	res.end();
}

function validatePath(scriptPath) {
	if (path.isAbsolute(scriptPath)) {
		throw util.format('The [%s] path is unacceptable', scriptPath);
	}

	if (!scriptPath.match(/^[a-zA-Z_0-9]/)) {
		throw util.format('The [%s] path is unacceptable', scriptPath);
	}
}

function listJsVariables(req, res) {
	var input = retrieveHttpSource(req, res);
	var scriptPath = input.nexlSource;

	if (!scriptPath || scriptPath.length < 1) {
		throw "nexl source is not provided";
	}

	scriptPath = scriptPath.replace(/^[\/\\]/g, '');

	// validating nexl source path
	validatePath(scriptPath);

	scriptPath = j79.fixPathSlashes(scriptPath);
	scriptPath = nexlServerUtils.assemblePath(NEXL_SOURCES_ROOT, scriptPath);

	var nexlSource = {
		asFile: {
			fileName: scriptPath
		}
	};

	try {
		var result = nexlEngine.resolveJsVariables(nexlSource);
		sendResult(result, input, res);
	} catch (e) {
		sendException(e, input, res);
	}

	// ending http session
	res.end();
}

function handleManagementRestRequests(req, res) {
	var url = req.url;

	switch (url.replace(/\?.*/, '')) {
		case REST_LIST_SOURCES:
			listNexlSources(req, res);
			return;

		case REST_LIST_JS_VARIABLES:
			listJsVariables(req, res);
			return;
	}

	res.status(500);
	res.write('Unknown rest service = ' + url);
	res.end();
}

function handleRootPage(req, res) {
	figlet.defaults({fontPath: "assets/fonts"});

	figlet("Welcome to nexl-server", function (err, data) {
		if (err) {
			throw 'Something went wrong...' + err
		}

		data = util.format('nexl-server version : %s\n%s', version, data);

		res.status(200);
		res.write(data);
		res.end();
	});
}

function prepareRequestAndValidate(req, res) {
	var httpSource = retrieveHttpSource(req, res);

	// removing leading ? character and leading slash character
	var url = req.url.replace(/\?.*/g, '').replace(/^[\/\\]/g, '');
	url = decodeURI(url);

	var input = {
		url: url,
		expression: httpSource.expression,
		args: httpSource,
		callback: httpSource.callback
	};

	validatePath(input.url);

	delete httpSource["expression"];
	delete httpSource["callback"];

	return input;
}

function sendJsonPResult(data, input, res) {
	var jsonPResult = makeJsonResult('data', input, data);
	res.write(jsonPResult);
}

function sendResult(result, input, res) {
	if (result === undefined) {
		sendException('Got undefined value', input, res);
		return;
	}

	// is jsonp ?
	if (isJsonP(input)) {
		sendJsonPResult(result, input, res);
		return;
	}

	// setting up content-type
	if (j79.isArray(result) || j79.isObject(result)) {
		res.header("Content-Type", 'application/json');
	} else {
		res.header("Content-Type", 'text/plain');
	}

	// string sends as is. all other must be stringified
	if (j79.isString(result)) {
		res.write(result);
	} else {
		res.write(JSON.stringify(result));
	}
}

function evalNexlExpressionInner(input, res) {
	var nexlSource = {
		asFile: {
			fileName: input.script2Exec
		}
	};

	var expression = input.expression;
	var args = nexlEngine.convertStrItems2Obj(input.args);

	// evaluating
	try {
		var result = nexlEngine.nexlize(nexlSource, expression, args);
		sendResult(result, input, res);
	} catch (e) {
		winston.error(e);
		sendException(e, input, res);
	}

	// ending http session
	res.end();
}

function evalNexlExpression(input, res) {
	// calculating absolute path for script
	var scriptPath = j79.fixPathSlashes(input.url);
	scriptPath = nexlServerUtils.assemblePath(NEXL_SOURCES_ROOT, scriptPath);

	input.script2Exec = scriptPath;
	evalNexlExpressionInner(input, res);
}

function handleGetRequests(req, res) {
	// is root url ?
	if (req.url == "/") {
		handleRootPage(req, res);
		return;
	}

	var input = prepareRequestAndValidate(req, res);

	winston.log('verbose', "GET request is accepted. [url=%s], [clientHost=%s]", req.url, req.connection.remoteAddress);

	// not a root url, handling script
	evalNexlExpression(input, res);
}

function use(req, res) {
	res.status(404);
	res.write("Bad request");
	res.end();
}

function handlePostRequests(req, res) {
	var input = prepareRequestAndValidate(req, res);

	winston.log('verbose', "POST request is accepted. [url=%s], [clientHost=%s]", req.url, req.connection.remoteAddress);

	evalNexlExpression(input, res);
}

function errorHandler(req, res, next) {
	use(req, res);
}

function applyBinders() {
	// favicon
	app.use(favicon(path.join(__dirname, 'favicon.ico')));

	// apply body parser ( for POST requests )
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended: true
	}));

	// server's rest
	app.post(NEXL_REST_URL + '/*', handleManagementRestRequests);
	app.get(NEXL_REST_URL + '/*', handleManagementRestRequests);

	// GET-request handler
	app.get("/*", handleGetRequests);

	// POST-request handler
	app.post("/*", handlePostRequests);

	// error handler
	app.use(errorHandler);
}

function createHttpServer() {
	// creating http-server
	server = app.listen(nexlServerUtils.cmdLineOpts.Network.port, nexlServerUtils.cmdLineOpts.Network.binding, function () {
		nexlServerUtils.printStartupMessage(server);
	});
}

function start() {
	j79.abortIfNodeVersionLowerThan(4);
	nexlServerUtils.handleArgs();
	nexlServerUtils.configureWinstonLogger();
	resolveNexlSourcesDir();
	nexlServerUtils.printInfo();
	applyBinders();
	createHttpServer();
	return server;
}

module.exports = start;