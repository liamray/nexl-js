var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var root = require('./routes/root-route');
var nexlRest = require('./routes/rest-route');
var nexlReserved = require('./routes/reserved-route');
var nexlExpressions = require('./routes/expressions-route');

var app = express();

app.use(favicon(path.join(__dirname, '../frontend/nexl/site/', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// static resources, root page, nexl rest, nexl expressions
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/', root);
app.use('/nexl/rest/*', nexlRest);
app.use('/nexl/*', nexlReserved);
app.use('/*', nexlExpressions);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
