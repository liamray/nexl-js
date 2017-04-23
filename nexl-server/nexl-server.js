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
const commandLineArgs = require('command-line-args');
const chalk = require('chalk');
const fs = require('fs');
const winston = j79.winston;
const version = require('./package.json').version;

const CMD_LINE_OPTS_DEF = [
	//////////////////////////////////////////////////////////////////////
	// Main
	{
		name: 'nexl-sources',
		alias: 's',
		desc: 'Path to a directory with nexl sources ( JavaScript files ). Default value is ${HOME}/nexl-sources',
		group: 'Main'
	},

	{
		name: 'help',
		alias: 'h',
		type: Boolean,
		defaultValue: false,
		desc: 'Displays help',
		group: 'Main'
	},

	//////////////////////////////////////////////////////////////////////
	// Network
	{
		name: 'port',
		alias: 'p',
		type: Number,
		defaultValue: 8080,
		desc: 'TCP listening port for nexl-server. Default value is 8080',
		group: 'Network'
	},
	{
		name: 'binding',
		alias: 'b',
		type: String,
		defaultValue: 'localhost',
		desc: 'Binding for network interface. Default value is localhost',
		group: 'Network'
	},

	//////////////////////////////////////////////////////////////////////
	// Logging
	{
		name: 'log-level',
		alias: 'v',
		type: String,
		defaultValue: 'info',
		desc: 'Available log levels are : ' + Object.keys(winston.levels).join(','),
		group: 'Logging'
	},
	{
		name: 'log-file',
		alias: 'l',
		type: String,
		desc: 'Log file name for nexl-server. Log file will be produced only if this switch is specified',
		group: 'Logging'
	},
	{
		name: 'log-rolling-size',
		alias: 'z',
		type: Number,
		defaultValue: 0,
		desc: 'Rolling file size in bytes. Default value is 0 which means no rolling. Applicable only if --log-file is provided',
		group: 'Logging'
	},
	{
		name: 'max-log-files',
		alias: 'a',
		type: String,
		desc: 'Max count of log files to roll. Default value is unlimited. Applicable only if --log-file and --log-rolling-size are provided',
		group: 'Logging'
	}
];

const FILE_SEPARATOR = path.sep;

const NEXL_REST_URL = '/nexl-rest';
const REST_LIST_SOURCES = NEXL_REST_URL + '/list-nexl-sources';
const REST_LIST_JS_VARIABLES = NEXL_REST_URL + '/list-js-variables';
const DEFAULT_NEXL_SOURCES_DIR = 'nexl-sources';

const HR = Array(55).join('-');

var NEXL_SOURCES_ROOT;
var server;
var cmdLineOpts;

function fixSlashes(path) {
	return path.replace(/[\\\/]/g, FILE_SEPARATOR);
}

function assemblePath() {
	// converting arguments to array
	var args = Array.prototype.slice.call(arguments);

	// joining array's elements
	var path = args.join(FILE_SEPARATOR);

	// removing double/triple/... slash characters
	return path.replace(/\/{2,}/, "/").replace(/\\{2,}/, "\\");
}

function makeJsonResult(field, input, data) {
	var result = {};
	result[field] = data;
	return util.format('%s ( %s )', input.callback, JSON.stringify(result));
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

function isJsonP(input) {
	return input.callback !== undefined;
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

function evalNexlExpressionWrapper(input, res) {
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

function throwError(e, res) {
	res.status(500);
	res.write(e.toString());
	res.end();
	throw e;
}

function evalNexlExpression(input, res) {
	// calculating absolute path for script
	var scriptPath = fixSlashes(input.url);
	scriptPath = assemblePath(NEXL_SOURCES_ROOT, scriptPath);

	input.script2Exec = scriptPath;
	evalNexlExpressionWrapper(input, res);
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

function handlePostRequests(req, res) {
	var input = prepareRequestAndValidate(req, res);

	winston.log('verbose', "POST request is accepted. [url=%s], [clientHost=%s]", req.url, req.connection.remoteAddress);

	evalNexlExpression(input, res);
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


function errorHandler(req, res, next) {
	use(req, res);
}

function isNotInfo() {
	return winston.levels[winston.level] < winston.levels['info'];
}

function printHelp() {
	var maxLen = 0;
	var groups = {};
	// discovering length of longest option
	for (var item in CMD_LINE_OPTS_DEF) {
		// length
		var item = CMD_LINE_OPTS_DEF[item];
		maxLen = Math.max(maxLen, item.name.length);

		// groups
		if (!groups[item.group]) {
			groups[item.group] = [];
		}

		groups[item.group].push(item);
	}

	// iterating over groups
	for (var group in groups) {
		console.log(group);

		for (var index in groups[group]) {
			var item = groups[group][index];
			var spaces = maxLen - item.name.length + 1;
			spaces = Array(spaces).join(' ');
			var text = util.format("\t-%s, --%s %s %s", item.alias, item.name, spaces, item.desc);
			console.log(text);
		}

		console.log();
	}

	// example
	console.log('\nFor example :\n\tnexl-server --nexl-sources=c:\\data\\nexl-sources --port=3001 --binding=10.0.0.1 --log-file=output.log --log-rolling-size=1048576 --log-level=debug --max-log-files=10');
}

function handleArgs() {
	try {
		cmdLineOpts = commandLineArgs(CMD_LINE_OPTS_DEF);
	} catch (e) {
		console.log('Wrong command line options');
		printHelp();
		throw e;
	}

	// is help ?
	if (cmdLineOpts.Main.help) {
		printHelp();
		process.exit();
	}
}

function resolveNexlSourcesDir() {
	// handling nexl-sources directory
	NEXL_SOURCES_ROOT = cmdLineOpts.Main['nexl-sources'];
	if (!NEXL_SOURCES_ROOT) {
		NEXL_SOURCES_ROOT = path.join(osHomeDir(), DEFAULT_NEXL_SOURCES_DIR);
	}

	fs.exists(NEXL_SOURCES_ROOT, function (result) {
		if (!result) {
			winston.error("nexl sources directory [%s] doesn't exist ! But you can still create it without server restart", NEXL_SOURCES_ROOT);
		}
	});

	winston.info('nexl sources directory is [%s]', NEXL_SOURCES_ROOT);

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

// handles special rest requests of nexl-server
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

	scriptPath = fixSlashes(scriptPath);
	scriptPath = assemblePath(NEXL_SOURCES_ROOT, scriptPath);

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

function printInfo() {
	try {
		winston.info(util.format('nexl-server version is [%s]', version));
		winston.info('WebSite http://www.nexl-js.com');
	} catch (e) {
		winston.error("It's not fatal but failed to print a nexl-server version. Please open me a bug. Exception : ", e);
	}
}

function printStartupMessage() {
	if (isNotInfo()) {
		return;
	}

	figlet.defaults({fontPath: "assets/fonts"});

	console.log('');
	console.log(HR);
	figlet("nexl-server", function (err, data) {
		if (err) {
			throw 'Something went wrong...' + err
		}

		console.log(data);
		console.log(HR);
		var port = server.address().port;
		var address = server.address().address;
		console.log(chalk.green(util.format('\n%s', new Date())));
		console.log(chalk.green(util.format("NEXL server is up and listening at [%s:%s]", address, port)));
	});
}

function createHttpServer() {
	// creating http-server
	server = app.listen(cmdLineOpts.Network.port, cmdLineOpts.Network.binding, function () {
		printStartupMessage();
	});
}

function printLog(options) {
	return j79.rawNowISODate() + ' ' + options.level.toUpperCase() + ' ' + (options.message ? options.message : '');
}

function configureWinstonLogger() {
	winston.configure({
		transports: [
			new (winston.transports.File)({
				filename: 'somefile.log',
				formatter: printLog,
				json: false,
				level: 'debug'
			}),
			new (winston.transports.Console)({
				formatter: printLog,
				level: 'debug'
			})
		]
	});

	var logLevel = cmdLineOpts.Logging['log-level'];
	winston.level = logLevel ? logLevel : 'info';

	winston.info('Use --help to view all command line switches');
}

function start() {
	j79.abortIfNodeVersionLowerThan(4);
	handleArgs();
	configureWinstonLogger();
	resolveNexlSourcesDir();
	printInfo();
	applyBinders();
	createHttpServer();
	return server;
}

module.exports = start;