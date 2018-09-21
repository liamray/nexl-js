const path = require('path');
const winston = require('winston');
const j79 = require('j79-utils');
const fse = require('fs-extra');

const security = require('./security');
const confMgmt = require('./conf-mgmt');
const confConsts = require('../common/conf-constants');

const generalLog = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)({
			formatter: logFormatter
		})
	]
});

function logFormatter(options) {
	return j79.rawNowISODate() + ' [' + options.level.toUpperCase() + '] ' + (options.message ? options.message : '');
}

function configureLoggers() {
	// resolving settings
	const settings = confMgmt.getNexlSettingsCached();
	// log file location
	const logFileLocation = settings[confConsts.SETTINGS.LOG_FILE_LOCATION];

	// creating dirs structure if needed
	return fse.mkdirs(logFileLocation).then(_ => initInner(settings, logFileLocation))
}

function initInner(settings, logFileLocation) {
	// removing file transports
	if (generalLog.transports['file']) {
		generalLog.remove(winston.transports.File);
	}
	// adding file transport for general
	generalLog.add(winston.transports.File, {
		filename: path.join(logFileLocation, 'nexl.log'),
		formatter: logFormatter,
		json: false,
		tailable: settings[confConsts.SETTINGS.LOG_ROTATE_FILE_SIZE] > 0,
		maxsize: settings[confConsts.SETTINGS.LOG_ROTATE_FILE_SIZE] * 1024,
		maxFiles: settings[confConsts.SETTINGS.LOG_ROTATE_FILES_COUNT]
	});

	// setting up level
	generalLog.level = settings[confConsts.SETTINGS.LOG_LEVEL];

	generalLog.debug('Log is set up');
	return Promise.resolve();
}

function isLogLevel(level) {
	return generalLog.levels[generalLog.level] >= generalLog.levels[level];
}

function getAvailLevels() {
	return Object.keys(winston.levels);
}

generalLog.importantMessage = function () {
	const args = Array.prototype.slice.call(arguments);
	generalLog.log(args[0], '');
	generalLog.log(args[0], '----------------------------------------------');
	args[1] = '| ' + args[1];
	generalLog.log.apply(generalLog, args);
	generalLog.log(args[0], '----------------------------------------------');
	generalLog.log(args[0], '');
};

function loggerInterceptor(req, res, next) {
	generalLog.debug("[method=%s], [url=%s], [clientHost=%s], [username=%s]", req.method.toUpperCase(), req.url, req.connection.remoteAddress, security.getLoggedInUsername(req));
	next();
}


// --------------------------------------------------------------------------------
module.exports.configureLoggers = configureLoggers;
module.exports.log = generalLog;
module.exports.LEVELS = Object.keys(winston.levels);
module.exports.isLogLevel = isLogLevel;
module.exports.getAvailLevels = getAvailLevels;
module.exports.loggerInterceptor = loggerInterceptor;
// --------------------------------------------------------------------------------