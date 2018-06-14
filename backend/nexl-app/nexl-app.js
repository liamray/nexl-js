const http = require('http');
const https = require('https');
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const util = require('util');
const figlet = require('figlet');

const confMgmt = require('../api/conf-mgmt');
const utils = require('../api/utils');
const logger = require('../api/logger');
const fsx = require('../api/fsx');
const version = require('../../package.json').version;

const expressionsRoute = require('../routes/expressions/expressions-route');
const notFoundInterceptor = require('../interceptors/404-interceptor');
const errorHandlerInterceptor = require('../interceptors/error-handler-interceptor');

const root = require('../routes/root/root-route');
const sourcesRoute = require('../routes/sources/sources-route');
const general = require('../routes/general/general-route');
const authRoute = require('../routes/auth/auth-route');
const permissionsRoute = require('../routes/permissions/permissions-route');
const settingsRoute = require('../routes/settings/settings-route');
const reservedRoute = require('../routes/reserved/reserved-route');

class NexlApp {
	constructor() {
		this.initCongMgmt();

		// creating app
		this.nexlApp = express();
	}

	initCongMgmt() {
		confMgmt.init();
	}

	getFavIconPath() {
		return '../../site/nexl/site/';
	}

	printWelcomeMessage() {
		return new Promise(
			(resolve, reject) => {
				figlet.text('nexl ' + version, {font: 'doom'}, function (err, data) {
					if (err) {
						reject(err);
						return;
					}

					console.log(data);
					resolve();
				});

			});
	}

	applyInterceptors() {
		// general interceptors
		this.nexlApp.use(session({
			secret: utils.generateRandomBytes(64),
			resave: false,
			saveUninitialized: false
		}));

		this.nexlApp.use(favicon(path.join(__dirname, this.getFavIconPath(), 'favicon.ico')));
		this.nexlApp.use((req, res, next) => {
			logger.logHttpRequest(req, res, next);
		});
		this.nexlApp.use(bodyParser.json());
		this.nexlApp.use(bodyParser.urlencoded({extended: false}));
		this.nexlApp.use(cookieParser());

		// static resources, root page, nexl rest, nexl expressions
		this.nexlApp.use(express.static(path.join(__dirname, '../../site')));

		// nexl routes
		this.nexlApp.use('/', root);
		this.nexlApp.use('/nexl/sources/', sourcesRoute);
		this.nexlApp.use('/nexl/auth/', authRoute);
		this.nexlApp.use('/nexl/permissions/', permissionsRoute);
		this.nexlApp.use('/nexl/settings/', settingsRoute);
		this.nexlApp.use('/nexl/general/', general);
		this.nexlApp.use('/nexl/', reservedRoute);
		this.nexlApp.use('/', expressionsRoute);

		// catch 404 and forward to error handler
		this.nexlApp.use(notFoundInterceptor);

		// error handler
		this.nexlApp.use(errorHandlerInterceptor);
	};

	httpError(error) {
		if (error.syscall !== 'listen') {
			logger.log.error('Cannot start HTTP listener. Reason : [%s]', utils.formatErr(error));
			process.exit(1);
		}

		// handling specific listen errors with friendly messages
		switch (error.code) {
			case 'EACCES':
				logger.log.error('Cannot start HTTP server on [%s:%s]. Original error message : [%s].\nOpen the [%s] file located in [%s] directory and adjust the [%s] and [%s] properties for HTTP connector', this.httpBinding, this.httpPort, utils.formatErr(error), confMgmt.CONF_FILES.SETTINGS, confMgmt.getNexlHomeDir(), confMgmt.SETTINGS.HTTP_BINDING, confMgmt.SETTINGS.HTTP_PORT);
				process.exit(1);
				break;
			case 'EADDRINUSE':
				logger.log.error('The [%s] port is already in use on [%s] interface. Original error message : [%s].\nOpen the [%s] file located in [%s] directory and adjust the [%s] and [%s] properties for HTTP connector', this.httpPort, this.httpBinding, utils.formatErr(error), confMgmt.CONF_FILES.SETTINGS, confMgmt.getNexlHomeDir(), confMgmt.SETTINGS.HTTP_BINDING, confMgmt.SETTINGS.HTTP_PORT);
				process.exit(1);
				break;
			default:
				logger.log.error('HTTP server error. Reason : [%s]', utils.formatErr(error));
				process.exit(1);
		}
	};

	httpsError(error) {
		if (error.syscall !== 'listen') {
			logger.log.error('Cannot start HTTPS listener. Reason : [%s]', utils.formatErr(error));
			process.exit(1);
		}

		// handling specific listen errors with friendly messages
		switch (error.code) {
			case 'EACCES':
				logger.log.error('Cannot start HTTPS server on [%s:%s]. Original error message : [%s].\nOpen the [%s] file located in [%s] directory and adjust the [%s] and [%s] properties for HTTP connector', this.httpsBinding, this.httpsPort, utils.formatErr(error), confMgmt.CONF_FILES.SETTINGS, confMgmt.getNexlHomeDir(), confMgmt.SETTINGS.HTTPS_BINDING, confMgmt.SETTINGS.HTTPS_PORT);
				process.exit(1);
				break;
			case 'EADDRINUSE':
				logger.log.error('The [%s] port is already in use on [%s] interface. Original error message : [%s].\nOpen the [%s] file located in [%s] directory and adjust the [%s] and [%s] properties for HTTP connector', this.httpsPort, this.httpsBinding, utils.formatErr(error), confMgmt.CONF_FILES.SETTINGS, confMgmt.getNexlHomeDir(), confMgmt.SETTINGS.HTTPS_BINDING, confMgmt.SETTINGS.HTTPS_PORT);
				process.exit(1);
				break;
			default:
				logger.log.error('HTTPS server error. Reason : [%s]', utils.formatErr(error));
				process.exit(1);
		}
	};

	httpListen() {
		logger.log.info('nexl HTTP server is up and listening on [%s:%s]', this.httpServer.address().address, this.httpServer.address().port);
	};

	httpsListen() {
		logger.log.info('nexl HTTPS server is up and listening on [%s:%s]', this.httpsServer.address().address, this.httpsServer.address().port);
	};

	startHTTP(settings) {
		this.httpBinding = settings[confMgmt.SETTINGS.HTTP_BINDING];
		this.httpPort = settings[confMgmt.SETTINGS.HTTP_PORT];

		// creating http server
		try {
			this.httpServer = http.createServer(this.nexlApp);
		} catch (e) {
			logger.log.error('Failed to start HTTP server. Reason : [%s]', utils.formatErr(e));
			return;
		}

		// error event handler
		this.httpServer.on('error', (error) => {
			this.httpError(error);
		});

		// listening handler
		this.httpServer.on('listening', () => {
			this.httpListen();
		});

		// starting http server
		this.httpServer.listen(this.httpPort, this.httpBinding);
	}

	assembleSSLCredentials() {
		return fsx.exists(this.sslCert).then((isExists) => {
			if (!isExists) {
				return Promise.reject(util.format('The [%s] SSL cert file doesn\'t exist', this.sslCert));
			}

			return fsx.exists(this.sslKey).then((isExists) => {
				if (!isExists) {
					return Promise.reject(util.format('The [%s] SSL key file doesn\'t exist', this.sslKey));
				}

				return fsx.readFile(this.sslCert).then((certFile) => {
					return fsx.readFile(this.sslKey).then((keyFile) => Promise.resolve({
						key: keyFile,
						cert: certFile
					}))
				});
			});
		});
	}

	startHTTPSInner() {
		this.assembleSSLCredentials().then(
			(sslCredentials) => {
				// creating http server
				try {
					this.httpsServer = https.createServer(sslCredentials, this.nexlApp);
				} catch (e) {
					return Promise.reject(utils.formatErr(e));
				}

				// error event handler
				this.httpsServer.on('error', (error) => {
					this.httpsError(error);
				});

				// listening handler
				this.httpsServer.on('listening', () => {
					this.httpsListen();
				});

				// starting http server
				this.httpsServer.listen(this.httpsPort, this.httpsBinding);
			}
		).catch(
			(err) => {
				logger.log.error('Failed to start HTTPS server. Reason : [%s]', err);
			}
		);
	}

	startHTTPS(settings) {
		this.httpsBinding = settings[confMgmt.SETTINGS.HTTPS_BINDING];
		this.httpsPort = settings[confMgmt.SETTINGS.HTTPS_PORT];
		this.sslCert = settings[confMgmt.SETTINGS.SSL_CERT_LOCATION];
		this.sslKey = settings[confMgmt.SETTINGS.SSL_KEY_LOCATION];

		if (utils.isEmptyStr(this.httpsBinding) && utils.isEmptyStr(this.httpsPort) && utils.isEmptyStr(this.sslCert) && utils.isEmptyStr(this.sslKey)) {
			logger.log.error('HTTPS listener will not be started. To start HTTPS listener provide the following settings : [%s, %s, %s, %s] in [%s] file located in [%s] directory', confMgmt.SETTINGS.HTTPS_BINDING, confMgmt.SETTINGS.HTTPS_PORT, confMgmt.SETTINGS.SSL_KEY_LOCATION, confMgmt.SETTINGS.SSL_CERT_LOCATION, confMgmt.CONF_FILES.SETTINGS, confMgmt.getNexlHomeDir());
			return;
		}

		if (utils.isNotEmptyStr(this.httpsBinding) && utils.isNotEmptyStr(this.httpsPort) && utils.isNotEmptyStr(this.sslCert) && utils.isNotEmptyStr(this.sslKey)) {
			this.startHTTPSInner();
			return;
		}

		logger.log.warn('HTTPS listener will not be started because one of the following settings is missing : [%s, %s, %s, %s] in [%s] file located in [%s] directory', confMgmt.SETTINGS.HTTPS_BINDING, confMgmt.SETTINGS.HTTPS_PORT, confMgmt.SETTINGS.SSL_KEY_LOCATION, confMgmt.SETTINGS.SSL_CERT_LOCATION, confMgmt.CONF_FILES.SETTINGS, confMgmt.getNexlHomeDir());
	}

	startNexlServer() {
		const settings = confMgmt.getNexlSettingsCached();
		this.startHTTP(settings);
		this.startHTTPS(settings);
	}

	stopNexlServer() {
		// todo : check is this.httpServer is undefined ( same for https )
		return new Promise((resolve, reject) => {
			this.httpServer.close(() => {
				resolve();
			});
		});
	}

	start() {
		// initial log level and it will be overridden in logger.init() method
		logger.log.level = 'info';

		// creating nexl home dir if doesn't exist
		this.printWelcomeMessage()
			.then(confMgmt.createNexlHomeDirectoryIfNeeded)
			.then(confMgmt.initSettings)
			.then(logger.init)
			.then(confMgmt.initTokens)
			.then(confMgmt.initPermissions)
			.then(confMgmt.initPasswords)
			.then(confMgmt.initAdmins)
			.then(confMgmt.createNexlSourcesDirIfNeeded)
			.then(
				() => {
					this.applyInterceptors();
					this.startNexlServer();
				}).catch(
			(err) => {
				console.log(err);
				process.exit(1);
			});
	}

	stop() {
		if (this.httpServer) {
			this.httpServer.close();
		}

		if (this.httpsServer) {
			this.httpsServer.close();
		}
	}
}

// --------------------------------------------------------------------------------
module.exports = NexlApp;
// --------------------------------------------------------------------------------
