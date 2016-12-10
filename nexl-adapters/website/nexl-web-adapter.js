/*
 * Web-site adapter for remote nexl server
 * Copyright (c) 2016 Yevgeny Sergeyev
 * License : Apache 2.0
 *
 * use a module.nexlWebAdapter.evalNexl() function to retrieve data items from remote nexl server
 * See Readme.md for more information
 * */

var module = (function (module) {

    module.nexlWebAdapter = {};

    function obj2Args(nexlArgs) {
        nexlArgs = nexlArgs || {};

        var result = '';
        for (var key in nexlArgs) {
            var val = nexlArgs[key];
            result += key + '=' + val;
            result += '&';
        }
        return result;
    }

    function handleFailure(x, opts, error, url, errorCallback) {
        if (errorCallback) {
            errorCallback(x, opts, error);
        } else {
            throw 'nexl server request is failed. url = [' + url + '], error is [' + error + ']';
        }
    }

    function handleSuccess(data, callback, errorCallback) {
        if (!data.error) {
            callback(data.data);
            return;
        }

        if (errorCallback) {
            errorCallback(null, null, data.error);
            return;
        }

        throw data.error;
    }

    /**
     * provide the following in params object :
     * - nexlServer
     * - nexlSource
     * - nexlExpression
     * - nexlArgs ( is an object )( optional )
     * - httpTimeout ( optional )
     */
    function evalNexl(params, callback, errorCallback) {

        var args = obj2Args(params.nexlArgs);
        var nexlSource = params.nexlSource;

        // removing leading slash if present
        nexlSource = nexlSource.replace(/^\//, '');

        // assembling url
        var url = 'http://' + params.nexlServer + '/' + nexlSource + '?expression=' + params.nexlExpression + '&' + args;
        console.log(url);

        // jsonP request
        $.ajax({
            type: 'GET',
            url: url,
            async: false,
            contentType: 'application/json',
            dataType: "jsonp",
            timeout: params.httpTimeout || 10,
            success: function (data) {
                handleSuccess(data, callback, errorCallback);
            },
            error: function (x, opts, error) {
                handleFailure(x, opts, error, url, errorCallback);
            }
        });
    }

    module.nexlWebAdapter.evalNexl = evalNexl;

    return module;

})(module || {});