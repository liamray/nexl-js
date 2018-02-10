const winston = require('winston');
const j79 = require('j79-utils');

const settings = require('./settings');

function logFormatter(options) {
	return j79.rawNowISODate() + ' [' + options.level.toUpperCase() + '] ' + (options.message ? options.message : '');
}

function init() {
	// removing existing console transport
	winston.remove(winston.transports.Console);

	// add new console transport
	winston.add(winston.transports.Console, {
		formatter: logFormatter
	});

	// loading log setting
	const logFile = settings.get(settings.LOG_FILE);
	const rollingSize = settings.get(settings.LOG_ROLLING_SIZE_KB);
	const maxLogFiles = settings.get(settings.MAX_LOG_FILES);
	const logLevel = settings.get(settings.LOG_LEVEL);

	// adding file transport
	winston.add(winston.transports.File, {
		filename: logFile,
		formatter: logFormatter,
		json: false,
		tailable: rollingSize > 0,
		maxsize: rollingSize * 1024,
		maxFiles: maxLogFiles
	});

	// setting up log level
	winston.level = logLevel;

	winston.debug('Log is set up');
}

function isLogLevel(level) {
	return winston.levels[winston.level] >= winston.levels[level];
}

function getAvailLevels() {
	return Object.keys(winston.levels);
}

function logHttpRequest(req, res, next) {
	winston.debug("[%s] request is accepted. [url=%s], [clientHost=%s]", req.method.toUpperCase(), req.url, req.connection.remoteAddress);
	next();
}

// --------------------------------------------------------------------------------
module.exports.init = init;
module.exports.log = winston;
module.exports.logHttpRequest = logHttpRequest;
module.exports.isLogLevel = isLogLevel;
module.exports.getAvailLevels = getAvailLevels;
// --------------------------------------------------------------------------------