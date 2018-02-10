const log = require('winston');
const j79 = require('j79-utils');

const settings = require('./settings');

function logFormatter(options) {
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


function init() {
	const logFile = settings.get(settings.LOG_FILE);
}

function isLogLevel(level) {
	return log.levels[log.level] >= log.levels[level];
}

function logHttpRequest(req, res, next) {
	next();
}

// --------------------------------------------------------------------------------
module.exports.init = init;
module.exports.log = log;
module.exports.logHttpRequest = logHttpRequest;
module.exports.isLogLevel = isLogLevel;
// --------------------------------------------------------------------------------