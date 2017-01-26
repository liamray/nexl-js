/**************************************************************************************
 nexl-source-utils

 Copyright (c) 2016-2017 Yevgeny Sergeyev
 License : Apache 2.0

 Set of utility functions for nexl-source
 **************************************************************************************/

const esprima = require('esprima');
const path = require('path');
const util = require('util');
const fs = require('fs');
const vm = require('vm');


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function resolveIncludeDirectiveDom(item) {
	if (!item.expression || item.expression["type"] != "Literal") {
		return null;
	}

	var itemValue = item.expression.raw;

	if (!itemValue) {
		return null;
	}

	// regex tells : starts from quote OR single quote, @ character, one OR unlimited amount of any character, ends with the same quote which it was started
	itemValue = itemValue.match(/^('|")@\s(.+)(\1)$/);
	if (itemValue && itemValue.length === 4) {
		return itemValue[2];
	} else {
		return null;
	}
}

function assembleSourceCodeAsFile(asFile) {
	var result;
	var fileName = asFile.fileName;

	if (!fs.existsSync(fileName)) {
		throw util.format("The source  [%s], doesn't exist", fileName);
	}

	if (!fs.lstatSync(fileName).isFile()) {
		throw util.format("The  [%s] source is not a file", fileName);
	}

	try {
		result = fs.readFileSync(fileName, "UTF-8");
	} catch (e) {
		throw util.format("Failed to read [%s] source content , error : [%s]", fileName, e);
	}


	// resolving include directives
	var includeDirectives = resolveIncludeDirectives(result);

	// iterating over and processing
	for (var index in includeDirectives) {
		var includeDirective = includeDirectives[index];

		// does directive have an absolute path ?
		if (path.isAbsolute(includeDirective)) {
			result += assembleSourceCodeAsFile({"fileName": includeDirective});
			continue;
		}

		// resolve file path
		var filePath = path.dirname(fileName);

		var fullPath = path.join(filePath, includeDirective);
		result += assembleSourceCodeAsFile({"fileName": fullPath});
	}

	return result;
}

// parses javascript provided as text and resolves nexl include directives ( like "@import ../../src.js"; )
function resolveIncludeDirectives(text) {
	var result = [];

	// parse source code with esprima
	var srcParsed = esprima.parse(text);

	// iterating over and looking for include directives
	for (var key in srcParsed.body) {
		var item = srcParsed.body[key];

		// resolve include directive from dom item
		var includeDirective = resolveIncludeDirectiveDom(item);
		if (includeDirective != null) {
			result.push(includeDirective);
		}
	}

	return result;
}

function assembleSourceCodeAsText(asText) {
	var result = asText.text;

	// resolving include directives
	var includeDirectives = resolveIncludeDirectives(asText.text);

	// iterating over and processing
	for (var index in includeDirectives) {
		var includeDirective = includeDirectives[index];

		// does directive have an absolute path ?
		if (path.isAbsolute(includeDirective)) {
			result += assembleSourceCodeAsFile({"fileName": includeDirective});
			continue;
		}

		// directive has a relative path. is path4imports provided ?
		if (!asText.path4imports) {
			throw "Your source code contains an include directive(s), but you didn't provide a path";
		}

		if (!fs.existsSync(asText.path4imports)) {
			throw util.format("Path you have provided [%s] doesn't exist", asText.path4imports);
		}

		var fullPath = path.join(asText.path4imports, includeDirective);
		result += assembleSourceCodeAsFile({"fileName": fullPath});
	}

	return result;
}

function assembleSourceCode(nexlSource) {
	// validating nexlSource
	if (typeof nexlSource === 'undefined') {
		throw "nexl source is not provided";
	}

	// is both provided ?
	if (nexlSource.asText && nexlSource.asFile) {
		throw "You have to provide asText or asFile, but not both at a same time";
	}

	if (nexlSource.asText) {
		return assembleSourceCodeAsText(nexlSource.asText);
	}

	if (nexlSource.asFile) {
		return assembleSourceCodeAsFile(nexlSource.asFile);
	}

	throw "nexlSource is empty ( doesn't contain asText or asFile )";
}

function createContext(nexlSource) {
	var context = {};
	var sourceCode = assembleSourceCode(nexlSource);

	try {
		vm.runInNewContext(sourceCode, context);
	} catch (e) {
		throw "Got a problem with a nexl source : " + e;
	}

	return context;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function resolveVarDeclarations(varDeclaration) {
	var result = [];
	for (var i = 0; i < varDeclaration.declarations.length; i++) {
		var item = varDeclaration.declarations[i];
		result.push(item.id.name);
	}

	return result;
}

function resolveJsVariables(nexlSource) {
	var sourceCode = assembleSourceCode(nexlSource);
	var parsedCode = esprima.parse(sourceCode).body;
	var result = [];
	for (var i = 0; i < parsedCode.length; i++) {
		var item = parsedCode[i];
		if (item.type !== 'VariableDeclaration') {
			continue;
		}

		var declarations = resolveVarDeclarations(item);
		result = result.concat(declarations);
	}

	return result.sort();
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// exports
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.createContext = createContext;
module.exports.resolveJsVariables = resolveJsVariables;
