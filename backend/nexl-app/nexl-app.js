const http = require('http');
const https = require('https');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const util = require('util');
const figlet = require('figlet');

const confMgmt = require('../api/conf-mgmt');
const confConsts = require('../common/conf-constants');
const restUrls = require('../common/rest-urls');
const jsFilesUtils = require('../api/jsfiles-utils');
const utils = require('../api/utils');
const logger = require('../api/logger');
const security = require('../api/security');
const fsx = require('../api/fsx');
const version = require('../../package.json').version;

const notFoundInterceptor = require('../interceptors/404-interceptor');
const errorHandlerInterceptor = require('../interceptors/error-handler-interceptor');

const staticSite = require('../routes/root/root-route');
const jsFilesRoute = require('../routes/jsfiles/jsfiles-route');
const general = require('../routes/general/general-route');
const usersRoute = require('../routes/users/users-route');
const permissionsRoute = require('../routes/permissions/permissions-route');
const settingsRoute = require('../routes/settings/settings-route');
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
	nexlApp.use(`/${restUrls.ROOT}/${restUrls.JS_FILES.PREFIX}/`, jsFilesRoute);
	nexlApp.use(`/${restUrls.ROOT}/${restUrls.USERS.PREFIX}/`, usersRoute);
	nexlApp.use(`/${restUrls.ROOT}/${restUrls.PERMISSIONS.PREFIX}/`, permissionsRoute);
	nexlApp.use(`/${restUrls.ROOT}/${restUrls.SETTINGS.PREFIX}/`, settingsRoute);
	nexlApp.use(`/${restUrls.ROOT}/${restUrls.GENERAL.PREFIX}/`, general);
	nexlApp.use(`/${restUrls.ROOT}/`, reservedRoute);
	nexlApp.use('/', expressionsRoute);

	// catch 404 and forward to error handler
	nexlApp.use(notFoundInterceptor);

	// error handler
	nexlApp.use(errorHandlerInterceptor);

	// initializing conf management
	confMgmt.init();

	return printWelcomeMessage()
		.then(confMgmt.createNexlHomeDirectoryIfNeeded)
		.then(confMgmt.initSettings)
		.then(logger.init)
		.then(confMgmt.initUsers)
		.then(confMgmt.initPermissions)
		.then(confMgmt.initAdmins);
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
			logger.log.error('Cannot start HTTP server on [%s:%s]. Original error message : [%s].\nOpen the [%s] file located in [%s] directory and adjust the [%s] and [%s] properties for HTTP connector', settings[confConsts.SETTINGS.HTTP_BINDING], settings[confConsts.SETTINGS.HTTP_PORT], utils.formatErr(error), confConsts.CONF_FILES.SETTINGS, confMgmt.getNexlHomeDir(), confConsts.SETTINGS.HTTP_BINDING, confConsts.SETTINGS.HTTP_PORT);
			process.exit(1);
			break;
		case 'EADDRINUSE':
			logger.log.error('The [%s] port is already in use on [%s] interface. Original error message : [%s].\nOpen the [%s] file located in [%s] directory and adjust the [%s] and [%s] properties for HTTP connector', settings[confConsts.SETTINGS.HTTP_PORT], settings[confConsts.SETTINGS.HTTP_BINDING], utils.formatErr(error), confConsts.CONF_FILES.SETTINGS, confMgmt.getNexlHomeDir(), confConsts.SETTINGS.HTTP_BINDING, confConsts.SETTINGS.HTTP_PORT);
			process.exit(1);
			break;
		default:
			logger.log.error('HTTP server error. Reason : [%s]', utils.formatErr(error));
			process.exit(1);
	}
}

function startHTTPServer() {
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
			logger.log.importantMessage('info', 'nexl HTTP server is up and listening on [%s:%s]', httpServer.address().address, httpServer.address().port);
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
			logger.log.error('Cannot start HTTPS server on [%s:%s]. Original error message : [%s].\nOpen the [%s] file located in [%s] directory and adjust the [%s] and [%s] properties for HTTP connector', settings[confConsts.SETTINGS.HTTPS_BINDING], settings[confConsts.SETTINGS.HTTPS_PORT], utils.formatErr(error), confConsts.CONF_FILES.SETTINGS, confMgmt.getNexlHomeDir(), confConsts.SETTINGS.HTTPS_BINDING, confConsts.SETTINGS.HTTPS_PORT);
			process.exit(1);
			break;
		case 'EADDRINUSE':
			logger.log.error('The [%s] port is already in use on [%s] interface. Original error message : [%s].\nOpen the [%s] file located in [%s] directory and adjust the [%s] and [%s] properties for HTTP connector', settings[confConsts.SETTINGS.HTTPS_PORT], settings[confConsts.SETTINGS.HTTPS_BINDING], utils.formatErr(error), confConsts.CONF_FILES.SETTINGS, confMgmt.getNexlHomeDir(), confConsts.SETTINGS.HTTPS_BINDING, confConsts.SETTINGS.HTTPS_PORT);
			process.exit(1);
			break;
		default:
			logger.log.error('HTTPS server error. Reason : [%s]', utils.formatErr(error));
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
			logger.log.importantMessage('info', 'nexl HTTPS server is up and listening on [%s:%s]', httpServer.address().address, httpServer.address().port);
			resolve();
		});

		// starting http server
		httpsServer.listen(settings[confConsts.SETTINGS.HTTPS_PORT], settings[confConsts.SETTINGS.HTTPS_BINDING]);
	});
}

function startHTTPSServer() {
	const settings = confMgmt.getNexlSettingsCached();
	const httpsBinding = settings[confConsts.SETTINGS.HTTPS_BINDING];
	const httpsPort = settings[confConsts.SETTINGS.HTTPS_PORT];
	const sslCert = settings[confConsts.SETTINGS.SSL_CERT_LOCATION];
	const sslKey = settings[confConsts.SETTINGS.SSL_KEY_LOCATION];

	if (utils.isEmptyStr(httpsBinding) && utils.isEmptyStr(httpsPort) && utils.isEmptyStr(sslCert) && utils.isEmptyStr(sslKey)) {
		logger.log.info('HTTPS listener will not be started. To start HTTPS listener provide the following settings : [%s, %s, %s, %s] in [%s] file located in [%s] directory', confConsts.SETTINGS.HTTPS_BINDING, confConsts.SETTINGS.HTTPS_PORT, confConsts.SETTINGS.SSL_KEY_LOCATION, confConsts.SETTINGS.SSL_CERT_LOCATION, confConsts.CONF_FILES.SETTINGS, confMgmt.getNexlHomeDir());
		return Promise.resolve();
	}

	if (utils.isNotEmptyStr(httpsBinding) && utils.isNotEmptyStr(httpsPort) && utils.isNotEmptyStr(sslCert) && utils.isNotEmptyStr(sslKey)) {
		return assembleSSLCerts().then(startHTTPSServerInner);
	} else {
		logger.log.info('HTTPS listener will not be started because one of the following settings is missing : [%s, %s, %s, %s] in [%s] file located in [%s] directory', confConsts.SETTINGS.HTTPS_BINDING, confConsts.SETTINGS.HTTPS_PORT, confConsts.SETTINGS.SSL_KEY_LOCATION, confConsts.SETTINGS.SSL_CERT_LOCATION, confConsts.CONF_FILES.SETTINGS, confMgmt.getNexlHomeDir());
		return Promise.resolve();
	}
}

function start() {
	return Promise.resolve()
		.then(confMgmt.createJSFilesRootDirIfNeeded)
		.then(jsFilesUtils.cacheJSFiles)
		.then(startHTTPServer)
		.then(startHTTPSServer)
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
