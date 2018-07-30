const winston = require('winston');
const j79 = require('j79-utils');

const confMgmt = require('./conf-mgmt');
const confConsts = require('../common/conf-constants');

function logFormatter(options) {
	return j79.rawNowISODate() + ' [' + options.level.toUpperCase() + '] ' + (options.message ? options.message : '');
}

function init() {
	// loading settings
	const settings = confMgmt.getNexlSettingsCached();

	// removing existing console transport
	winston.remove(winston.transports.Console);

	// add new console transport
	winston.add(winston.transports.Console, {
		formatter: logFormatter
	});

	// loading log setting
	// adding file transport
	winston.add(winston.transports.File, {
		filename: settings[confConsts.SETTINGS.LOG_FILE_LOCATION],
		formatter: logFormatter,
		json: false,
		tailable: settings[confConsts.SETTINGS.LOG_ROTATE_FILE_SIZE] > 0,
		maxsize: settings[confConsts.SETTINGS.LOG_ROTATE_FILE_SIZE] * 1024,
		maxFiles: settings[confConsts.SETTINGS.LOG_ROTATE_FILES_COUNT]
	});

	// setting up log level
	winston.level = settings[confConsts.SETTINGS.LOG_LEVEL];

	winston.debug('Log is set up');

	return Promise.resolve();
}

function isLogLevel(level) {
	return winston.levels[winston.level] >= winston.levels[level];
}

function getAvailLevels() {
	return Object.keys(winston.levels);
}

winston.importantMessage = function () {
	const args = Array.prototype.slice.call(arguments);
	winston.log(args[0], '');
	winston.log(args[0], '----------------------------------------------');
	args[1] = '| ' + args[1];
	winston.log.apply(null, args);
	winston.log(args[0], '----------------------------------------------');
	winston.log(args[0], '');
};

function loggerInterceptor(req, res, next) {
	winston.debug("[%s] request is accepted. [url=%s], [clientHost=%s]", req.method.toUpperCase(), req.url, req.connection.remoteAddress);
	next();
}


// --------------------------------------------------------------------------------
module.exports.init = init;
module.exports.log = winston;
module.exports.LEVELS = Object.keys(winston.levels);
module.exports.isLogLevel = isLogLevel;
module.exports.getAvailLevels = getAvailLevels;
module.exports.loggerInterceptor = loggerInterceptor;
// --------------------------------------------------------------------------------