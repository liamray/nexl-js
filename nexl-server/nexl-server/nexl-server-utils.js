/**************************************************************************************
 nexl-server-log-utils

 Copyright (c) 2016 Yevgeny Sergeyev
 License : Apache 2.0
 WebSite : http://www.nexl-js.com

 Logging utility functions for nexl-server
 **************************************************************************************/

// include
const j79 = require('j79-utils');
const path = require('path');
const util = require('util');
const osHomeDir = require('os-homedir');
const figlet = require('figlet');
const commandLineArgs = require('command-line-args');
const chalk = require('chalk');
const fs = require('fs');
const winston = j79.winston;
const version = require('./../package.json').version;

const HR = new Array(55).join('-');
const DEFAULT_NEXL_SOURCES_DIR = 'nexl-sources';

const NEXL_SOURCES = 'nexl-sources';
const LOG_LEVEL = 'log-level';
const LOG_FILE = 'log-file';
const LOG_ROLLING_SIZE = 'log-rolling-size';
const MAX_LOG_FILES = 'max-log-files';
const DEFAULT_ROLLING_SIZE = 999;
const DEFAULT_LOG_LEVEL = 'info';

const CMD_LINE_OPTS_DEF = [
	//////////////////////////////////////////////////////////////////////
	// Main
	{
		name: NEXL_SOURCES,
		alias: 's',
		desc: 'Path to directory with nexl sources ( JavaScript files ). Default value is ${HOME}/nexl-sources',
		group: 'Main'
	},

	{
		name: 'help',
		alias: 'h',
		type: Boolean,
		defaultValue: false,
		desc: 'Displays available options',
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
		name: LOG_LEVEL,
		alias: 'v',
		type: String,
		defaultValue: 'info',
		desc: 'Available log levels are : ' + Object.keys(winston.levels).join(',') + '. Default log level is ' + DEFAULT_LOG_LEVEL,
		group: 'Logging'
	},
	{
		name: LOG_FILE,
		alias: 'l',
		type: String,
		desc: 'Log file name for nexl-server. Log file will be produced only if this options is specified',
		group: 'Logging'
	},
	{
		name: LOG_ROLLING_SIZE,
		alias: 'z',
		type: Number,
		defaultValue: 0,
		desc: 'Log file rolling size in bytes. Default value is 0 which means no rolling. Applicable only if --log-file is provided',
		group: 'Logging'
	},
	{
		name: MAX_LOG_FILES,
		alias: 'a',
		defaultValue: DEFAULT_ROLLING_SIZE,
		type: Number,
		desc: 'Max count of log files to roll. Default value is ' + DEFAULT_ROLLING_SIZE + '. Applicable only if --log-file and --log-rolling-size are provided',
		group: 'Logging'
	}
];

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
		module.exports.cmdLineOpts = commandLineArgs(CMD_LINE_OPTS_DEF);
	} catch (e) {
		console.log('Wrong command line options');
		printHelp();
		throw e;
	}

	// is help ?
	if (module.exports.cmdLineOpts.Main.help) {
		printHelp();
		process.exit();
	}
}

function printLog(options) {
	return j79.rawNowISODate() + ' [' + options.level.toUpperCase() + '] ' + (options.message ? options.message : '');
}

function addFileTransportIfNeeded() {
	// log file name specified via arguments
	var logFileName = module.exports.cmdLineOpts.Logging[LOG_FILE];

	// is log file name not provided ?
	if (logFileName == undefined || logFileName.length < 1) {
		return;
	}

	// resolving rolling size ( in bytes )
	var rollingSize = module.exports.cmdLineOpts.Logging[LOG_ROLLING_SIZE];
	// is NaN ?
	if (rollingSize !== rollingSize || rollingSize === undefined) {
		rollingSize = 0;
	}

	// resolving max log files for rolling
	var maxLogFiles = module.exports.cmdLineOpts.Logging[MAX_LOG_FILES];
	// is NaN ?
	if (maxLogFiles !== maxLogFiles || maxLogFiles === undefined) {
		maxLogFiles = Number.MAX_SAFE_INTEGER;
		maxLogFiles = 999
	}

	winston.add(winston.transports.File, {
		filename: logFileName,
		formatter: printLog,
		json: false,
		tailable: rollingSize > 0,
		maxsize: rollingSize,
		maxFiles: maxLogFiles
	});
}
function configureWinstonLogger() {
	// removing existing console transport
	winston.remove(winston.transports.Console);

	// add new console transport
	winston.add(winston.transports.Console, {
		formatter: printLog
	});

	// add file transport if file name is provided via arguments
	addFileTransportIfNeeded();

	// resolving log level from arguments
	var logLevel = module.exports.cmdLineOpts.Logging[LOG_LEVEL];

	// setting up log level. "info" by default
	winston.level = logLevel ? logLevel : DEFAULT_LOG_LEVEL;

	winston.info('Use --help to view all command line options');
}

function printInfo() {
	try {
		winston.info(util.format('nexl-server version is [%s]', version));
		winston.info('WebSite http://www.nexl-js.com');
	} catch (e) {
		winston.error("It's not fatal but failed to print a nexl-server version. Please open me a bug. Exception : ", e);
	}
}

function printStartupMessage(server) {
	if (!j79.isLogLevel('info')) {
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

function resolveNexlSourcesDir() {
	// resolving nexl-source dir from command line arguments
	module.exports.nexlSourcesDir = module.exports.cmdLineOpts.Main[NEXL_SOURCES];

	// if not provided use a OS home dir + nexl-sources
	if (!module.exports.nexlSourcesDir) {
		module.exports.nexlSourcesDir = path.join(osHomeDir(), DEFAULT_NEXL_SOURCES_DIR);
	}

	// print error if nexl-sources directory doesn't exist
	fs.exists(module.exports.nexlSourcesDir, function (result) {
		if (!result) {
			winston.error("nexl sources directory [%s] doesn't exist ! But you can still create it without server restart", module.exports.nexlSourcesDir);
		}
	});

	winston.info('nexl sources directory is [%s]', module.exports.nexlSourcesDir);
}

function throw500Error(e, res) {
	res.status(500);
	res.write(e.toString());
	res.end();
	throw e;
}

function validatePath(scriptPath, res) {
	if (path.isAbsolute(scriptPath) || !scriptPath.match(/^[a-zA-Z_0-9]/)) {
		var msg = util.format('The [%s] path is unacceptable', scriptPath);
		throw500Error(msg, res);
	}
}

function init() {
	j79.abortIfNodeVersionLowerThan(4);
	handleArgs();
	configureWinstonLogger();
	resolveNexlSourcesDir();
	printInfo();
}

module.exports.printStartupMessage = printStartupMessage;
module.exports.validatePath = validatePath;
module.exports.throw500Error = throw500Error;
module.exports.init = init;