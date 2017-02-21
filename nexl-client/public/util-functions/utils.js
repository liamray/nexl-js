/**
 * util module
 * requires jQuery
 */

var module = (function (module) {
	module.utils = {};

	module.utils.shortFileName = function (fileName) {
		return fileName.replace(/.*[\\//]/, '');
	};

	module.utils.joinPathElements = function () {
		var result = '';
		$.each(arguments, function (index, argument) {
			result += ( argument + '\r\n' )
		});
		return result;
	};

	module.utils.reducePath = function (path) {
		var lastIndex = path.lastIndexOf('\\');
		lastIndex = Math.max(path.lastIndexOf('/'), lastIndex);
		lastIndex = Math.max(0, lastIndex);
		return path.substr(0, lastIndex);
	};

	module.utils.restCall = function (url, params, callback, errorCallback) {
		$.post(url, params)
			.done(function (data) {
				callback(data);
			}).fail(function (data) {
			if (errorCallback) {
				errorCallback(data);
			}
		});
	};

	module.utils.jsonPCall = function (url, params, callback, errorCallback) {
		var paramsAsString = '?';
		$.each(params, function (key, val) {
			var tmp = String.format('{0}={1}', key, val);
			tmp = encodeURI(tmp);
			tmp = tmp.replace(/&/g, '%26');
			paramsAsString += tmp;
			paramsAsString += '&';
		});

		// remove last & if exists
		paramsAsString = paramsAsString.replace(/&$/, '');

		$.ajax({
				url: url + paramsAsString,
				dataType: "jsonp",
				success: function (data) {
					callback(data);
				},
				error: function (xhr, status, error) {
					errorCallback(xhr, status, error);
				}
			}
		);
	};

	module.utils.urlParser = function (url) {
		var parser = $('<a>').prop('href', url);

		var result = {};
		result.host = parser.prop('host');
		result.protocol = parser.prop('protocol');

		return result;
	};

	return module;

})(module || {});