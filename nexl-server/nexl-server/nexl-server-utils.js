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

const HR = Array(55).join('-');
const DEFAULT_NEXL_SOURCES_DIR = 'nexl-sources';


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

	var logLevel = module.exports.cmdLineOpts.Logging['log-level'];
	winston.level = logLevel ? logLevel : 'info';

	winston.info('Use --help to view all command line switches');
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
	module.exports.nexlSourcesDir = module.exports.cmdLineOpts.Main['nexl-sources'];

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

function validatePath(scriptPath) {
	if (path.isAbsolute(scriptPath)) {
		throw util.format('The [%s] path is unacceptable', scriptPath);
	}

	if (!scriptPath.match(/^[a-zA-Z_0-9]/)) {
		throw util.format('The [%s] path is unacceptable', scriptPath);
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
module.exports.init = init;