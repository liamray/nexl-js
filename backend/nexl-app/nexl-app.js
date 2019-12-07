const http = require('http');
const https = require('https');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const util = require('util');
const figlet = require('figlet');
const CronJob = require('cron').CronJob;

const confMgmt = require('../api/conf-mgmt');
const confConsts = require('../common/conf-constants');
const restUrls = require('../common/rest-urls');
const storageUtils = require('../api/storage-utils');
const utils = require('../api/utils');
const logger = require('../api/logger');
const security = require('../api/security');
const fsx = require('../api/fsx');
const schemas = require('../common/schemas');
const version = require('../../package.json').version;

const notFoundInterceptor = require('../interceptors/404-interceptor');
const errorHandlerInterceptor = require('../interceptors/error-handler-interceptor');

const staticSite = require('../routes/root/root-route');
const storageRoute = require('../routes/storage/storage-route');
const general = require('../routes/general/general-route');
const usersRoute = require('../routes/users/users-route');
const permissionsRoute = require('../routes/permissions/permissions-route');
const settingsRoute = require('../routes/settings/settings-route');
const webhooksRoute = require('../routes/webhooks-route');
const expressionsRoute = require('../routes/expressions/expressions-route');
const reservedRoute = require('../routes/reserved/reserved-route');

let nexlApp, httpServer, httpsServer;

function printWelcomeMessage() {
	return new Promise(
		(resolve, reject) => {
			figlet.text('nexl ' + version, {font: 'Doom'}, function (err, data) {
				if (err) {
					reject(err);
					return;
				}

				console.log(data);
				resolve();
			});

		});
}


function create(interceptors) {
	nexlApp = express();

	( interceptors || [] ).forEach(item => {
		nexlApp.use(item);
	});

	// static resources, root page, nexl rest, nexl expressions
	nexlApp.use(express.static(path.join(__dirname, '../../site')));

	// index html
	nexlApp.use('/', staticSite);

	// general interceptors
	nexlApp.use(session({
		secret: utils.generateRandomBytes(64),
		resave: false,
		saveUninitialized: false
	}));

	nexlApp.use(bodyParser.json());
	nexlApp.use(bodyParser.urlencoded({extended: false}));
	nexlApp.use(cookieParser());

	// auth interceptor
	nexlApp.use(security.authInterceptor);

	// logger to log REST requests
	nexlApp.use(logger.loggerInterceptor);

	// REST routes
	nexlApp.use(`/${restUrls.ROOT}/${restUrls.STORAGE.PREFIX}/`, storageRoute);
	nexlApp.use(`/${restUrls.ROOT}/${restUrls.USERS.PREFIX}/`, usersRoute);
	nexlApp.use(`/${restUrls.ROOT}/${restUrls.PERMISSIONS.PREFIX}/`, permissionsRoute);
	nexlApp.use(`/${restUrls.ROOT}/${restUrls.SETTINGS.PREFIX}/`, settingsRoute);
	nexlApp.use(`/${restUrls.ROOT}/${restUrls.WEBHOOKS.PREFIX}/`, webhooksRoute);
	nexlApp.use(`/${restUrls.ROOT}/${restUrls.GENERAL.PREFIX}/`, general);
	nexlApp.use(`/${restUrls.ROOT}/`, reservedRoute);
	nexlApp.use('/', expressionsRoute);

	// catch 404 and forward to error handler
	nexlApp.use(notFoundInterceptor);

	// error handler
	nexlApp.use(errorHandlerInterceptor);

	return printWelcomeMessage()
		.then(confMgmt.initNexlHomeDir)
		.then(logger.configureLoggers)
		.then(confMgmt.preloadConfs);
}

function httpError(error) {
	if (error.syscall !== 'listen') {
		logger.log.error('Cannot start HTTP listener. Reason : [%s]', utils.formatErr(error));
		process.exit(1);
	}

	const settings = confMgmt.getNexlSettingsCached();

	// handling specific listen errors with friendly messages
	switch (error.code) {
		case 'EACCES':
			logger.log.importantMessage('info', 'Cannot start HTTP server on [%s:%s]. Original error message : [%s].\nOpen the [%s] file located in [%s] directory and adjust the [%s] and [%s] properties for HTTP connector', settings[confConsts.SETTINGS.HTTP_BINDING], settings[confConsts.SETTINGS.HTTP_PORT], utils.formatErr(error), confConsts.CONF_FILES.SETTINGS, confMgmt.getNexlAppDataDir(), confConsts.SETTINGS.HTTP_BINDING, confConsts.SETTINGS.HTTP_PORT);
			process.exit(1);
			break;
		case 'EADDRINUSE':
			logger.log.importantMessage('info', 'The [%s] port is already in use on [%s] interface. Original error message : [%s].\nOpen the [%s] file located in [%s] directory and adjust the [%s] and [%s] properties for HTTP connector', settings[confConsts.SETTINGS.HTTP_PORT], settings[confConsts.SETTINGS.HTTP_BINDING], utils.formatErr(error), confConsts.CONF_FILES.SETTINGS, confMgmt.getNexlAppDataDir(), confConsts.SETTINGS.HTTP_BINDING, confConsts.SETTINGS.HTTP_PORT);
			process.exit(1);
			break;
		default:
			logger.log.importantMessage('info', 'HTTP server error. Reason : [%s]', utils.formatErr(error));
			process.exit(1);
	}
}

function startHTTPServer() {
	const settings = confMgmt.getNexlSettingsCached();
	if (!schemas.hasHttpConnector(settings)) {
		logger.log.debug(`HTTP binding and/or port is not provided. Not starting HTTP listener`);
		return Promise.resolve();
	}

	return new Promise((resolve, reject) => {
		// creating http server
		try {
			httpServer = http.createServer(nexlApp);
		} catch (err) {
			logger.log.error('Failed to start HTTP server. Reason : [%s]', utils.formatErr(e));
			reject(err);
			return;
		}

		const settings = confMgmt.getNexlSettingsCached();
		httpServer.setTimeout(reCalcHttpTimeout(settings[confConsts.SETTINGS.HTTP_TIMEOUT]));

		// error event handler
		httpServer.on('error', (error) => {
			httpError(error);
		});

		// listening handler
		httpServer.on('listening', () => {
			const localBindingMsg = settings[confConsts.SETTINGS.HTTP_BINDING] === 'localhost' ? `. Please pay attention !!! The [localhost] binding is not allowing to access nexl server outside this host. Edit the [${confConsts.CONF_FILES.SETTINGS}] file located in [${confMgmt.getNexlAppDataDir()}] dir to change an HTTP binding` : '';
			logger.log.importantMessage('info', 'nexl HTTP server is up and listening on [%s:%s]%s', httpServer.address().address, httpServer.address().port, localBindingMsg);
			resolve();
		});

		// starting http server
		httpServer.listen(settings[confConsts.SETTINGS.HTTP_PORT], settings[confConsts.SETTINGS.HTTP_BINDING]);
	});
}

function assembleSSLCerts() {
	const settings = confMgmt.getNexlSettingsCached();
	const sslCert = settings[confConsts.SETTINGS.SSL_CERT_LOCATION];
	const sslKey = settings[confConsts.SETTINGS.SSL_KEY_LOCATION];

	return fsx.exists(sslCert).then((isExists) => {
		if (!isExists) {
			return Promise.reject(util.format('The [%s] SSL cert file doesn\'t exist', sslCert));
		}

		return fsx.exists(sslKey).then((isExists) => {
			if (!isExists) {
				return Promise.reject(util.format('The [%s] SSL key file doesn\'t exist', sslKey));
			}

			return fsx.readFile(sslCert).then((certFile) => {
				return fsx.readFile(sslKey).then((keyFile) => Promise.resolve({
					key: keyFile,
					cert: certFile
				}))
			});
		});
	});
}

function httpsError() {
	if (error.syscall !== 'listen') {
		logger.log.error('Cannot start HTTPS listener. Reason : [%s]', utils.formatErr(error));
		process.exit(1);
	}

	// handling specific listen errors with friendly messages
	switch (error.code) {
		case 'EACCES':
			logger.log.importantMessage('info', 'Cannot start HTTPS server on [%s:%s]. Original error message : [%s].\nOpen the [%s] file located in [%s] directory and adjust the [%s] and [%s] properties for HTTP connector', settings[confConsts.SETTINGS.HTTPS_BINDING], settings[confConsts.SETTINGS.HTTPS_PORT], utils.formatErr(error), confConsts.CONF_FILES.SETTINGS, confMgmt.getNexlAppDataDir(), confConsts.SETTINGS.HTTPS_BINDING, confConsts.SETTINGS.HTTPS_PORT);
			process.exit(1);
			break;
		case 'EADDRINUSE':
			logger.log.importantMessage('info', 'The [%s] port is already in use on [%s] interface. Original error message : [%s].\nOpen the [%s] file located in [%s] directory and adjust the [%s] and [%s] properties for HTTP connector', settings[confConsts.SETTINGS.HTTPS_PORT], settings[confConsts.SETTINGS.HTTPS_BINDING], utils.formatErr(error), confConsts.CONF_FILES.SETTINGS, confMgmt.getNexlAppDataDir(), confConsts.SETTINGS.HTTPS_BINDING, confConsts.SETTINGS.HTTPS_PORT);
			process.exit(1);
			break;
		default:
			logger.log.importantMessage('info', 'HTTPS server error. Reason : [%s]', utils.formatErr(error));
			process.exit(1);
	}
}

function startHTTPSServerInner(sslCredentials) {
	return new Promise((resolve, reject) => {
		// creating http server
		try {
			httpsServer = https.createServer(sslCredentials, nexlApp);
		} catch (err) {
			logger.log.error('Failed to start HTTPS server. Reason : [%s]', utils.formatErr(e));
			reject(err);
			return;
		}

		const settings = confMgmt.getNexlSettingsCached();
		httpsServer.setTimeout(reCalcHttpTimeout(settings[confConsts.SETTINGS.HTTP_TIMEOUT]));

		// error event handler
		httpsServer.on('error', (error) => {
			httpsError(error);
		});

		// listening handler
		httpsServer.on('listening', () => {
			const localBindingMsg = settings[confConsts.SETTINGS.HTTPS_BINDING] === 'localhost' ? `. Please pay attention !!! The [localhost] binding is not allowing to access nexl server outside this host. Edit the [${confConsts.CONF_FILES.SETTINGS}] file located in [${confMgmt.getNexlAppDataDir()}] dir to change an HTTPS binding` : '';
			logger.log.importantMessage('info', 'nexl HTTPS server is up and listening on [%s:%s]%s', httpServer.address().address, httpServer.address().port, localBindingMsg);
			resolve();
		});

		// starting http server
		httpsServer.listen(settings[confConsts.SETTINGS.HTTPS_PORT], settings[confConsts.SETTINGS.HTTPS_BINDING]);
	});
}

function startHTTPSServer() {
	const settings = confMgmt.getNexlSettingsCached();
	if (!schemas.hasHttpsConnector(settings)) {
		logger.log.debug(`HTTPS binding|port|cert|key is not provided. Not starting HTTPS listener`);
		return Promise.resolve();
	}

	return assembleSSLCerts().then(startHTTPSServerInner);
}

function scheduleStorageBackup() {
	// preparing
	const settings = confMgmt.getNexlSettingsCached();
	const cronExpression = settings[confConsts.SETTINGS.BACKUP_STORAGE_CRON_EXPRESSION];
	const destDir = settings[confConsts.SETTINGS.BACKUP_STORAGE_DIR];

	// is cron expression specified ?
	if (utils.isEmptyStr(cronExpression)) {
		logger.log.debug('Not starting automatic storage backup. Reason: cron expression is not specified');
		return;
	}

	// is dest dir specified ?
	if (utils.isEmptyStr(destDir)) {
		logger.log.debug('Not starting automatic storage backup. Reason: backup output dir is not specified');
		return;
	}

	// scheduling
	try {
		const job = new CronJob(cronExpression, function () {
			storageUtils.backupStorage();
		});
		job.start();
	} catch (e) {
		logger.log.error(e);
		return Promise.reject(`Failed to schedule a backup. Reason: [utils.formatErr(e)]`);
	}

	return Promise.resolve();
}

function start() {
	return Promise.resolve()
		.then(confMgmt.createStorageDirIfNeeded)
		.then(storageUtils.cacheStorageFiles)
		.then(startHTTPServer)
		.then(startHTTPSServer)
		.then(scheduleStorageBackup)
		.then(_ => {
			logger.log.info(`nexl home dir is [${confMgmt.getNexlHomeDir()}]`);
			logger.log.info(`nexl app data dir is [${confMgmt.getNexlAppDataDir()}]`);
			logger.log.info(`nexl logs dir is [${confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.LOG_FILE_LOCATION]}]`);
			logger.log.info(`nexl storage dir is [${confMgmt.getNexlStorageDir()}]`);
			return Promise.resolve();
		})
		.catch(
			err => {
				console.log(err);
				process.exit(1);
			});

}

function stop() {
	if (httpServer !== undefined) {
		httpServer.close();
	}

	if (httpsServer !== undefined) {
		httpsServer.close();
	}
}

function reCalcHttpTimeout(timeout) {
	return timeout * 1000;
}

function setHttpTimeout(timeout) {
	if (httpServer !== undefined) {
		httpServer.setTimeout(reCalcHttpTimeout(timeout));
	}

	if (httpsServer !== undefined) {
		httpsServer.setTimeout(reCalcHttpTimeout(timeout));
	}
}

// --------------------------------------------------------------------------------
module.exports.create = create;
module.exports.start = start;
module.exports.stop = stop;
module.exports.setHttpTimeout = setHttpTimeout;
// --------------------------------------------------------------------------------
