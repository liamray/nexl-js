const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');

const utils = require('../api/utils');
const common = require('./common');

const devInterceptor = require('../interceptors/dev-interceptor');
const root = require('../routes/root-route');
const sourcesRoute = require('../routes/sources-route');
const authRoute = require('../routes/auth-route');
const reservedRoute = require('../routes/reserved-route');
const expressionsRoute = require('../routes/expressions-route');
const notFoundInterceptor = require('../interceptors/404-interceptor');
const errorHandlerInterceptor = require('../interceptors/error-handler-interceptor');

const app = express();

app.use(session({
	secret: utils.generateRandomBytes(64),
	resave: false,
	saveUninitialized: false
}));
app.use(favicon(path.join(__dirname, '../../frontend/nexl/site/', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// static resources, root page, nexl rest, nexl expressions
app.use(express.static(path.join(__dirname, '../../frontend')));

// dev interceptor
if (app.get('env') === common.DEV_MODE) {
	app.use(devInterceptor);
}

app.use('/', root);
app.use('/nexl/sources/', sourcesRoute);
app.use('/nexl/auth/', authRoute);
app.use('/nexl/', reservedRoute);
app.use('/', expressionsRoute);

// catch 404 and forward to error handler
app.use(notFoundInterceptor);

// error handler
app.use(errorHandlerInterceptor);

// --------------------------------------------------------------------------------
module.exports = app;
// --------------------------------------------------------------------------------
