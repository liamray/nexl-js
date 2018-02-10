const http = require('http');
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');

const confMgmt = require('../api/conf-mgmt');
const utils = require('../api/utils');
const settings = require('../api/settings');
const logger = require('../api/logger');

const expressionsRoute = require('../routes/expressions/expressions-route');
const notFoundInterceptor = require('../interceptors/404-interceptor');
const errorHandlerInterceptor = require('../interceptors/error-handler-interceptor');

const root = require('../routes/root/root-route');
const sourcesRoute = require('../routes/sources/sources-route');
const authRoute = require('../routes/auth/auth-route');
const reservedRoute = require('../routes/reserved/reserved-route');

class NexlApp {
	constructor() {
		// resolving port from settings
		this.httpBinding = settings.get(settings.NEXL_HTTP_BINDING);
		this.httpPort = settings.get(settings.NEXL_HTTP_PORT);

		// creating app
		this.nexlApp = express();
	}

	applyInterceptors() {
		// general interceptors
		this.nexlApp.use(session({
			secret: utils.generateRandomBytes(64),
			resave: false,
			saveUninitialized: false
		}));

		this.nexlApp.use(favicon(path.join(__dirname, '../../frontend/nexl/site/', 'favicon.ico')));
		this.nexlApp.use((req, res, next) => {
			logger.logHttpRequest(req, res, next);
		});
		this.nexlApp.use(bodyParser.json());
		this.nexlApp.use(bodyParser.urlencoded({extended: false}));
		this.nexlApp.use(cookieParser());

		// static resources, root page, nexl rest, nexl expressions
		this.nexlApp.use(express.static(path.join(__dirname, '../../frontend')));

		// nexl routes
		this.nexlApp.use('/', root);
		this.nexlApp.use('/nexl/sources/', sourcesRoute);
		this.nexlApp.use('/nexl/auth/', authRoute);
		this.nexlApp.use('/nexl/', reservedRoute);
		this.nexlApp.use('/', expressionsRoute);

		// catch 404 and forward to error handler
		this.nexlApp.use(notFoundInterceptor);

		// error handler
		this.nexlApp.use(errorHandlerInterceptor);
	};

	onError(error) {
		if (error.syscall !== 'listen') {
			throw error;
		}

		// handle specific listen errors with friendly messages
		switch (error.code) {
			case 'EACCES':
				console.error('Cannot start server on [' + this.httpPort + '] port');
				process.exit(1);
				break;
			case 'EADDRINUSE':
				console.error('The [' + this.httpPort + '] port is already in use');
				process.exit(1);
				break;
			default:
				throw error;
		}
	};

	onListen() {
		logger.log.info('nexl is up and listening on [%s:%s]', this.nexlServer.address().address, this.nexlServer.address().port);
	};

	startNexlServer() {
		// creating http server
		this.nexlServer = http.createServer(this.nexlApp);

		// error event handler
		this.nexlServer.on('error', (error) => {
			this.onError(error);
		});

		// listening handler
		this.nexlServer.on('listening', () => {
			this.onListen();
		});

		// starting http server
		this.nexlServer.listen(this.httpPort, this.httpBinding);
	}

	start() {
		// creating nexl home dir if doesn't exist
		confMgmt.createNexlHomeDirIfNeeded();

		// initializing logger
		logger.init();

		// initializing nexl directories if needed
		confMgmt.initNexlHomeDir();
		utils.initNexlSourcesDir();

		// interceptors
		this.applyInterceptors();

		this.startNexlServer();
	}
}

// --------------------------------------------------------------------------------
module.exports = NexlApp;
// --------------------------------------------------------------------------------
