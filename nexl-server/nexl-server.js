/**************************************************************************************
 nexl-server

 Copyright (c) 2016 Yevgeny Sergeyev
 License : Apache 2.0
 WebSite : http://www.nexl-js.com

 JavaScript based read only configuration data storage where every single data element is a javascript variable
 **************************************************************************************/

(function () {
	// includes
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
	const version = require('./package.json').version;

	var CMD_LINE_OPTS_DEF = [
		{
			name: 'nexl-sources',
			alias: 's',
			desc: 'Specifies nexl sources directory. By default it points to a ${HOME}/nexl-sources directory'
		},
		{name: 'debug', alias: 'd', type: Boolean, defaultValue: false, desc: 'Prints debug messages to console'},
		{
			name: 'port',
			alias: 'p',
			type: Number,
			defaultValue: 8080,
			desc: 'Specifies nexl server port. 8080 by default'
		},
		{
			name: 'binding',
			alias: 'b',
			type: String,
			defaultValue: 'localhost',
			desc: 'Binds nexl server to a specified interface. localhost by default'
		},
		{name: 'help', alias: 'h', type: Boolean, defaultValue: false, desc: 'display this help'}
	];

	var NEXL_SOURCES_ROOT;
	const FILE_SEPARATOR = path.sep;

	const NEXL_REST_URL = '/nexl-rest';
	const REST_LIST_SOURCES = NEXL_REST_URL + '/list-nexl-sources';
	const REST_LIST_JS_VARIABLES = NEXL_REST_URL + '/list-js-variables';
	const DEFAULT_NEXL_SOURCES_DIR = 'nexl-sources';

	const HR = Array(55).join('-');

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

	function printDebug(msg) {
		if (cmdLineOpts.debug) {
			console.log(util.format("DEBUG [%s] %s", new Date(), msg));
		}
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
			console.log(e);
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

		printDebug(util.format("POST request is accepted. url=[%s], clientHost = [%s]", req.url, req.connection.remoteAddress));

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

		printDebug(util.format("GET request is accepted. url=[%s], clientHost = [%s]", req.url, req.connection.remoteAddress));

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

	function printHelp() {
		var maxLen = 0;
		// discovering length of longest option
		for (var item in CMD_LINE_OPTS_DEF) {
			var item = CMD_LINE_OPTS_DEF[item];
			maxLen = Math.max(maxLen, item.name.length);
		}

		// printing
		for (var item in CMD_LINE_OPTS_DEF) {
			var item = CMD_LINE_OPTS_DEF[item];
			var spaces = maxLen - item.name.length + 1;
			spaces = Array(spaces).join(' ');
			var text = util.format("-%s, --%s %s %s", item.alias, item.name, spaces, item.desc);
			console.log(text);
		}

		// example
		console.log('\nFor example :\nnexl-server --nexl-sources=c:\\data\\nexl-sources');
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
		if (cmdLineOpts.help) {
			printHelp();
			process.exit();
		}

		console.log('Use --help to view all command line switches');

		// handling nexl-sources directory
		NEXL_SOURCES_ROOT = cmdLineOpts['nexl-sources'];
		if (!NEXL_SOURCES_ROOT) {
			NEXL_SOURCES_ROOT = path.join(osHomeDir(), DEFAULT_NEXL_SOURCES_DIR);
			var msg = util.format("\nWarning ! nexl sources directory is not provided, using default directory for nexl sources : [%s]\n", NEXL_SOURCES_ROOT);
			printDebug(chalk.yellow.bold(msg));
		}

		fs.exists(NEXL_SOURCES_ROOT, function (result) {
			if (!result) {
				console.log(chalk.red.bold(util.format("nexl sources directory [%s] doesn't exist ! But you can still create it without server restart", NEXL_SOURCES_ROOT)));
			}
		});

		console.log('\nnexl sources directory is [%s]', NEXL_SOURCES_ROOT);
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
			console.log(util.format('nexl-server version is [%s]', version));
			console.log('WebSite http://www.nexl-js.com\n');
		} catch (e) {
			console.log("It's not fatal but failed to print a nexl-server version. Please open me a bug. Exception : " + e);
		}
	}

	function printStartupMessage() {
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
		server = app.listen(cmdLineOpts.port, cmdLineOpts.binding, function () {
			printStartupMessage();
		});
	}

	function start() {
		// validating nodejs version
		j79.abortIfNodeVersionLowerThan(4);

		printInfo();
		applyBinders();
		handleArgs();
		createHttpServer();
		return server;
	}

	module.exports = start;
}());