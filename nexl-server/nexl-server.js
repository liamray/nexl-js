/**************************************************************************************
 nexl-server
 Copyright (c) 2016 Yevgeny Sergeyev
 License : Apache 2.0

 JavaScript based read only configuration data storage where every single data element is a javascript variable
 **************************************************************************************/

(function () {
    var CMD_LINE_OPTS_DEF = [
        {name: 'nexl-source', alias: "s", desc: "Points to nexl sources directory"},
        {name: 'debug', alias: "d", type: Boolean, defaultValue: false, desc: "Print debug message to console"},
        {name: 'port', alias: "p", type: Number, defaultValue: 8080, desc: "nexl server port"},
        {name: 'binding', alias: "b", type: String, defaultValue: 'localhost', desc: "nexl server binging"},
        {name: 'help', alias: "h", type: Boolean, defaultValue: false, desc: "display this help"}
    ];

    // includes
    var nexlEngine = require('nexl-engine');
    var path = require('path');
    var bodyParser = require('body-parser');
    var util = require('util');
    var express = require('express');
    var app = express();
    var osHomeDir = require('os-homedir');
    var favicon = require('serve-favicon');
    var figlet = require('figlet');
    var commandLineArgs = require('command-line-args');
    var chalk = require('chalk');
    var fs = require('fs');

    var NEXL_SOURCES_ROOT;
    var FILE_SEPARATOR = path.sep;

    var NEXL_REST_URL = '/nexl-rest';
    var REST_LIST_SOURCES = NEXL_REST_URL + '/list-nexl-sources';
    var REST_LIST_JS_VARIABLES = NEXL_REST_URL + '/list-js-variables';

    var HR = Array(55).join('-');

    var server;
    var cmdLineOpts;

    // C:\Program Files\nodejs\node.exe => C:\Program Files\nodejs
    function removeLastPathElement(path) {
        return path.replace(/[\\\/][^\\\/]*$/g, "");
    }

    function fixSlashes(path) {
        return path.replace(/[\\\/]/g, FILE_SEPARATOR);
    }

    function isString(obj) {
        return Object.prototype.toString.call(obj) === "[object String]";
    }

    function isArray(obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    }

    function isObject(obj) {
        return Object.prototype.toString.call(obj) === "[object Object]";
    }

    function wrapWithArrayIfNeeded(obj) {
        return isArray(obj) ? obj : [obj];
    }

    function assemblePath() {
        // converting arguments to array
        var args = Array.prototype.slice.call(arguments);

        // joining array's elements
        var path = args.join(FILE_SEPARATOR);

        // removing double/triple/... slash characters
        return path.replace(/\/{2,}/, "/").replace(/\\{2,}/, "\\");
    }

    function printDebug(msg) {
        if (cmdLineOpts.debug) {
            console.log(util.format("DEBUG [%s] %s", new Date(), msg));
        }
    }

    function makeJsonPResult(fieldName, input, preResult) {
        // wrapping with object
        var result = {};
        result[fieldName] = preResult;

        // stringifying
        result = JSON.stringify(result);

        // wrapping with jsonP callback
        return util.format('%s ( %s )', input.callback, result);
    }

    function sendResult(preResult, input, res) {
        var data;

        // is jsonp ?
        if (isJsonP(input)) {
            data = makeJsonPResult('data', input, preResult);
        } else {
            data = preResult.join("\n");
        }

        res.write(data);
    }

    function isJsonP(input) {
        return input.callback !== undefined;
    }

    function sendException(err, input, res) {
        err = err.toString();

        if (isJsonP(input)) {
            err = makeJsonPResult('error', input, err);
        } else {
            res.status(500);
        }

        res.write(err);
    }

    function evalNexlExpressionWrapper(input, res) {
        var nexlSource = {
            asFile: {
                fileName: input.script2Exec
            }
        };

        var expression = input.expression;
        var args = input.args;

        // evaluating
        try {
            var result = nexlEngine.evalAndSubstNexlExpression(nexlSource, expression, args);
            sendResult(result, input, res);
        } catch (e) {
            sendException(e, input, res);
        }

        // ending http session
        res.end();
    }

    function throwError(e, res) {
        res.status(500);
        res.write(e.toString());
        res.end();
        throw e;
    }

    function evalNexlExpression(input, res) {
        // calculating absolute path for script
        var scriptPath = fixSlashes(input.url);
        scriptPath = assemblePath(NEXL_SOURCES_ROOT, scriptPath);

        input.script2Exec = scriptPath;
        evalNexlExpressionWrapper(input, res);
    }

    function retrieveHttpSource(req, res) {
        if (req.method.toUpperCase() == "GET") {
            return req.query;
        }

        if (req.method.toUpperCase() == "POST") {
            return req.body;
        }

        throwError("Unsupported HTTP-method = [" + req.method + "]", res);
    }

    function prepareRequestAndValidate(req, res) {
        var httpSource = retrieveHttpSource(req, res);

        // removing leading ? character and leading slash character
        var url = req.url.replace(/\?.*/g, '').replace(/^[\/\\]/g, '');
        url = decodeURI(url);

        var input = {
            url: url,
            expression: httpSource.expression,
            args: httpSource,
            callback: httpSource.callback
        };

        validatePath(input.url);

        delete httpSource["expression"];
        delete httpSource["callback"];

        // validating expression
        if (!input.expression) {
            throw util.format("nexl expression is not provided. nexl source : [%s], method : [%s]", input.url, req.method);
        }

        return input;
    }

    function handlePostRequests(req, res) {
        var input = prepareRequestAndValidate(req, res);

        printDebug(util.format("POST request is accepted. url=[%s], clientHost = [%s]", req.url, req.connection.remoteAddress));

        evalNexlExpression(input, res);
    }

    // produces json object with deep structure. x.y.z will be treated as 3 nested objects
    function produceJson(key, val, result) {
        // KEY can contain dots and going to be splitted by dots
        var values = key.split('.');

        var obj = result;

        // iterating over spliited elements in key and putting every element into json object
        for (var i = 0; i < values.length - 1; i++) {
            var subValue = values[i];

            // is sub element doesn't exist in json object, create it
            if (!obj[subValue]) {
                obj[subValue] = {};
            }

            // diving deeper
            obj = obj[subValue];
        }

        obj[values[values.length - 1]] = val;
    }

    function handleRootPage(req, res) {
        figlet.defaults({fontPath: "assets/fonts"});

        figlet("Welcome to nexl-server", function (err, data) {
            if (err) {
                throw 'Something went wrong...' + err
            }

            res.status(200);
            res.write(data);
            res.end();
        });

    }

    function handleGetRequests(req, res) {
        // is root url ?
        if (req.url == "/") {
            handleRootPage(req, res);
            return;
        }

        var input = prepareRequestAndValidate(req, res);

        printDebug(util.format("GET request is accepted. url=[%s], clientHost = [%s]", req.url, req.connection.remoteAddress));

        // not a root url, handling script
        evalNexlExpression(input, res);
    }

    function use(req, res) {
        res.status(404);
        res.write("Bad request");
        res.end();
    }


    function errorHandler(req, res, next) {
        use(req, res);
    }

    function printHelp() {
        var maxLen = 0;
        // discovering length of longest option
        for (var item in CMD_LINE_OPTS_DEF) {
            var item = CMD_LINE_OPTS_DEF[item];
            maxLen = Math.max(maxLen, item.name.length);
        }

        // printing
        for (var item in CMD_LINE_OPTS_DEF) {
            var item = CMD_LINE_OPTS_DEF[item];
            var spaces = maxLen - item.name.length + 1;
            spaces = Array(spaces).join(' ');
            var text = util.format("-%s, --%s %s %s", item.alias, item.name, spaces, item.desc);
            console.log(text);
        }
    }

    function handleArgs() {
        try {
            cmdLineOpts = commandLineArgs(CMD_LINE_OPTS_DEF);
        } catch (e) {
            console.log('Wrong command line options');
            printHelp();
            throw e;
        }

        // is help ?
        if (cmdLineOpts.help) {
            printHelp();
            process.exit();
        }

        console.log('Type the following to view all command line switches :\n\tnpm start -- --help');

        // handling nexl-sources directory
        NEXL_SOURCES_ROOT = cmdLineOpts['nexl-source'];
        if (!NEXL_SOURCES_ROOT) {
            NEXL_SOURCES_ROOT = path.join(osHomeDir(), 'nexl-sources');
            var msg = util.format("\nWarning ! nexl sources root directory is not provided, using default directory for nexl sources : [%s]\n", NEXL_SOURCES_ROOT);
            console.log(chalk.yellow.bold(msg));
        }

        printDebug(util.format("nexl sources directory is [%s]", NEXL_SOURCES_ROOT));
        fs.exists(NEXL_SOURCES_ROOT, function (result) {
            if (!result) {
                console.log(chalk.red.bold(util.format("nexl sources root directory [%s] doesn't exist ! But you can still create it without server restart", NEXL_SOURCES_ROOT)));
            }
        });
    }

    function enumerateFiles(dir, collection) {
        var fileItems = [];
        var dirItems = [];

        var items = fs.readdirSync(dir);
        for (var key in  items) {
            var item = items[key];
            var subPath = path.join(dir, item);
            var stat = fs.statSync(subPath);

            if (stat.isDirectory()) {
                var dirItem = {};
                dirItem.text = item;
                dirItem.type = 'dir';
                dirItem.children = enumerateFiles(subPath);
                dirItems.push(dirItem);
            }

            if (stat.isFile()) {
                var fileItem = {};
                fileItem.text = item;
                fileItem.type = 'file';
                fileItem.icon = "jstree-file";
                fileItems.push(fileItem);
            }
        }

        return dirItems.concat(fileItems);
    }

    // handles special rest requests of nexl-server
    function listNexlSources(req, res) {
        var input = retrieveHttpSource(req, res);

        try {
            var result = enumerateFiles(NEXL_SOURCES_ROOT);
        } catch (e) {
            sendException(e, input, res);
            res.end();
            return;
        }

        // is jsonp ?
        if (isJsonP(input)) {
            result = makeJsonPResult('data', input, result);
            res.write(result);
        } else {
            res.json(result);
        }

        res.end();
    }

    function validatePath(scriptPath) {
        if (path.isAbsolute(scriptPath)) {
            throw util.format('The [%s] path is unacceptable', scriptPath);
        }

        if (!scriptPath.match(/^[a-zA-Z_0-9]/)) {
            throw util.format('The [%s] path is unacceptable', scriptPath);
        }
    }

    function listJsVariables(req, res) {
        var input = retrieveHttpSource(req, res);
        var scriptPath = input.nexlSource;

        if (!scriptPath || scriptPath.length < 1) {
            throw "nexl source is not provided";
        }

        scriptPath = scriptPath.replace(/^[\/\\]/g, '');

        // validating nexl source path
        validatePath(scriptPath);

        scriptPath = fixSlashes(scriptPath);
        scriptPath = assemblePath(NEXL_SOURCES_ROOT, scriptPath);

        var nexlSource = {
            asFile: {
                fileName: scriptPath
            }
        };

        try {
            var result = nexlEngine.resolveJsVariables(nexlSource);
            sendResult(result, input, res);
        } catch (e) {
            sendException(e, input, res);
        }

        // ending http session
        res.end();
    }

    function handleManagementRestRequests(req, res) {
        var url = req.url;

        switch (url.replace(/\?.*/, '')) {
            case REST_LIST_SOURCES:
                listNexlSources(req, res);
                return;

            case REST_LIST_JS_VARIABLES:
                listJsVariables(req, res);
                return;
        }

        res.status(500);
        res.write('Unknown rest service = ' + url);
        res.end();
    }

    function applyBinders() {
        // favicon
        app.use(favicon(path.join(__dirname, 'favicon.ico')));

        // apply body parser ( for POST requests )
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({
            extended: true
        }));

        // server's rest
        app.post(NEXL_REST_URL + '/*', handleManagementRestRequests);
        app.get(NEXL_REST_URL + '/*', handleManagementRestRequests);

        // GET-request handler
        app.get("/*", handleGetRequests);

        // POST-request handler
        app.post("/*", handlePostRequests);

        // error handler
        app.use(errorHandler);
    }

    function printCurrentVersion() {
        try {
            console.log(util.format('nexl-server version is [%s]\n', require('./package.json').version));
        } catch (e) {
            console.log("It's not fatal but failed to print a nexl-server version. Please open me a bug. Exception : " + e);
        }
    }

    function printStartupMessage() {
        printCurrentVersion();

        figlet.defaults({fontPath: "assets/fonts"});

        console.log(HR);
        figlet("nexl-server", function (err, data) {
            if (err) {
                throw 'Something went wrong...' + err
            }

            console.log(data);
            console.log(HR);
            var port = server.address().port;
            var address = server.address().address;
            console.log(chalk.green(util.format("\nNEXL server is up and listening at [%s:%s]", address, port)));
        });
    }

    function createHttpServer() {
        // creating http-server
        server = app.listen(cmdLineOpts.port, cmdLineOpts.binding, function () {
            printStartupMessage();
        });
    }

    function start() {
        applyBinders();
        handleArgs();
        createHttpServer();
    }

    module.exports = start;
}());