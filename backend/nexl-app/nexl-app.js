const debug = require('debug')('nexl:server');
const http = require('http');
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');

const utils = require('../api/utils');
const settings = require('../api/settings');

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
		this.port = settings.get(settings.NEXL_HTTP_PORT);

		// creating app
		this.nexlApp = express();
	}

	onError(error) {
		if (error.syscall !== 'listen') {
			throw error;
		}

		// handle specific listen errors with friendly messages
		switch (error.code) {
			case 'EACCES':
				console.error('Cannot start server on [' + this.port + '] port');
				process.exit(1);
				break;
			case 'EADDRINUSE':
				console.error('The [' + this.port + '] port is already in use');
				process.exit(1);
				break;
			default:
				throw error;
		}
	};

	onListen() {
		debug('nexl is up and listening on [%s:%s]', this.nexlServer.address().address, this.nexlServer.address().port);
	};

	applyInterceptors() {
		// general interceptors
		this.nexlApp.use(session({
			secret: utils.generateRandomBytes(64),
			resave: false,
			saveUninitialized: false
		}));

		this.nexlApp.use(favicon(path.join(__dirname, '../../frontend/nexl/site/', 'favicon.ico')));
		this.nexlApp.use(logger('dev'));
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

	start() {
		// interceptors
		this.applyInterceptors();

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
		this.nexlServer.listen(this.port);
	}
}

// --------------------------------------------------------------------------------
module.exports = NexlApp;
// --------------------------------------------------------------------------------
