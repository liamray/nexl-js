/**************************************************************************************
 nexl-engine-utils

 Copyright (c) 2016 Yevgeny Sergeyev
 License : Apache 2.0

 Set of utility functions for nexl-engine
 **************************************************************************************/

const esprima = require('esprima');
const path = require('path');
const util = require('util');
const fs = require('fs');
const vm = require('vm');
const j79 = require('j79-utils');

var MODIFIERS = {
	"DELIMITER": "?",
	"DEF_VALUE": ":",
	"DONT_OMIT_WHOLE_EXPRESSION": "+",
	"OMIT_WHOLE_EXPRESSION": "-",
	"ABORT_ON_UNDEF_VAR": "!",
	"TREAT_AS": "~",
	"REVERSE_RESOLUTION": "<"
};

var GLOBAL_SETTINGS = {
	// is used when concatenating arrays
	DEFAULT_DELIMITER: "\n",

	// abort/not abort script execution if it's met an undefined variable
	ABORT_ON_UNDEFINED_VAR: true,

	// who is stronger the external arguments or variables in source script with the same name ?
	ARGS_ARE_OVERRIDING_SRC: true,

	// if true and has an undefined variables, the whole expression will be omitted
	SKIP_UNDEFINED_VARS: false
};

var KNOWN_BRACKETS = {
	'{': '}',
	'(': ')',
	'[': ']'
};

var MODIFIERS_ESCAPE_REGEX;


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
module.exports.assembleSourceCode = assembleSourceCode;

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

module.exports.resolveJsVariables = resolveJsVariables;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// extracts the first level variable ( only the first item )
function extractFirstLevelVar(str) {
	var start = 0;

	// searching for not escaped ${ characters, saving the position in start variable
	while (true) {
		start = str.indexOf("${", start);
		if (start < 0) {
			// there no first level variables
			return null;
		}
		if (( start > 0 ) && ( str.charAt(start - 1) == '\\' )) {
			start++;
			continue;
		}
		break;
	}

	var closeBracketPos = findClosestBracketPos(str, start + 1);
	if (closeBracketPos < 0) {
		// there no first level variables
		return null;
	}

	var extractedVar = str.substr(start, closeBracketPos - start + 1);
	str = str.substr(closeBracketPos);
	// returning the first level variable and the of str
	return {flvName: extractedVar, restStr: str};
}

function extractFirstLevelVars(str) {
	var result = [];
	// oneFlv is an object which contains the following : flvName ( first level variable name ), restStr ( the rest of str after flvName )
	var oneFlv = extractFirstLevelVar(str);
	while (oneFlv != null) {
		result.push(oneFlv.flvName);
		str = oneFlv.restStr;
		oneFlv = extractFirstLevelVar(str);
	}
	return result;
}

function hasFirstLevelVars(str) {
	return extractFirstLevelVar(str) != null;
}

function findClosestBracketPos(str, start) {
	var openBracket = str.charAt(start);
	var closeBracket = KNOWN_BRACKETS[openBracket];
	if (!closeBracket) {
		return -1;
	}

	var bracketCount = 1;
	for (var i = start + 1; i < str.length; i++) {
		if (str.charAt(i) == openBracket) {
			bracketCount++;
		}
		if (str.charAt(i) == closeBracket) {
			bracketCount--;
		}
		if (bracketCount < 1) {
			return i;
		}
	}

	return -1;
}

function whereIsVariableEnds(str, index) {
	// nexl variable consist at least of 4 characters like ${x}
	if (str.length < index + 4) {
		throw "Invalid variable declaration. Variable length seems to short. Variable is [" + str + "]";
	}

	// checking for open bracket
	if (str.charAt(index + 1) != '{') {
		throw "Bad expression. In the [" + str + "] at the " + index + " position should be an open bracket";
	}

	var closeBracketPos = findClosestBracketPos(str, index + 1);
	if (closeBracketPos < 0) {
		throw "Variable [" + str + "] is not closed with right bracket";
	}

	return closeBracketPos;
}

module.exports.whereIsVariableEnds = whereIsVariableEnds;
module.exports.hasFirstLevelVars = hasFirstLevelVars;
module.exports.extractFirstLevelVars = extractFirstLevelVars;
module.exports.findClosestBracketPos = findClosestBracketPos;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var MODIFIERS_ESCAPE_REGEX;

function assembleModifiersRegex() {
	MODIFIERS_ESCAPE_REGEX = "";
	for (var key in MODIFIERS) {
		var val = MODIFIERS[key];
		val = val.replace(/(\?)|(\+)/, "\\\\$&");
		var item = "|\\\\(" + val + ")";
		MODIFIERS_ESCAPE_REGEX += item;
	}
	if (MODIFIERS_ESCAPE_REGEX.length > 0) {
		MODIFIERS_ESCAPE_REGEX = MODIFIERS_ESCAPE_REGEX.replace(/^./, "");
	}
}


function unescapeString(str) {
	var regex = new RegExp(MODIFIERS_ESCAPE_REGEX, "g");
	return str.replace(regex, "$1");
}

function unescape(item) {
	if (j79.isString(item)) {
		return unescapeString(item);
	}
	if (j79.isArray(item)) {
		for (var i = 0; i < item.length; i++) {
			item[i] = unescape(item[i]);
		}
	}
	return item;
}

module.exports.unescapeString = unescapeString;
module.exports.unescape = unescape;
assembleModifiersRegex();

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function obj2Xml(objCandidate) {
	throw '~X modifier still not implemented';
}

function isDefValueSet(value) {
	if (!value) {
		return false;
	}

	if (j79.isArray(value)) {
		if (value.length > 1) {
			return true;
		}
		if (value.length < 1) {
			return false;
		}
		return value[0] != null;
	}

	if (j79.isObject(value)) {
		for (var key in value) {
			return true;
		}
		return false;
	}

	return value != "";
}


function isVarStuffEmpty(varStuff) {
	return varStuff.value.length == 0 || ( varStuff.value.length == 1 && varStuff.value[0] == null );
}


function isModifierAt(str, index) {
	for (var modifierName in MODIFIERS) {
		var modifierChar = MODIFIERS[modifierName];
		if (j79.isUnescapedCharAt(str, modifierChar, index)) {
			return {"name": modifierName, "index": index};
		}
	}
	return null;
}

function findNexlModifier(str, fromIndex) {
	var i = fromIndex;
	while (i < str.length) {
		if (j79.isUnescapedCharAt(str, '$', i)) {
			i = whereIsVariableEnds(str, i) + 1;
			continue;
		}
		var modifier = isModifierAt(str, i);
		if (modifier != null) {
			return modifier;
		}
		i++;
	}
	return null;
}

function isModifierOn(modifier) {
	return typeof modifier !== 'undefined';
}

function pushDefValueModifier(varStuff, modifier, value) {
	if (!varStuff.MODIFIERS[modifier]) {
		varStuff.MODIFIERS[modifier] = [];
	}
	varStuff.MODIFIERS[modifier].push(value);
}

function validateAndPushModifier(varStuff, item) {
	var modifier = item.name;
	if (MODIFIERS[modifier] == MODIFIERS.DEF_VALUE) {
		pushDefValueModifier(varStuff, modifier, item.value);
		return;
	}
	if (isModifierOn(varStuff.MODIFIERS[modifier])) {
		throw "You can't use more than one [" + MODIFIERS[modifier] + "] modifier for [" + varStuff.varName + "] variable";
	}
	varStuff.MODIFIERS[modifier] = item.value;
	if (isModifierOn(varStuff.MODIFIERS.OMIT_WHOLE_EXPRESSION) && isModifierOn(varStuff.MODIFIERS.DONT_OMIT_WHOLE_EXPRESSION)) {
		throw "You can't use the [+] and [-] modifiers simultaneously for [" + varStuff.varName + "] variable";
	}
}

function addModifiers(str, varStuff) {
	var modifiers = [];
	var index = 0;
	while (index < str.length) {
		var modifier = findNexlModifier(str, index);
		if (modifier == null) {
			break;
		}
		modifiers.push(modifier);
		index = modifier.index + 1;
	}
	var dummyItem = {"index": str.length};
	modifiers.push(dummyItem);
	for (var i = 1; i < modifiers.length; i++) {
		var currentItem = modifiers[i - 1];
		var nextItem = modifiers[i];
		var item = {};
		item.name = currentItem.name;
		item.value = str.substring(currentItem.index + 1, nextItem.index);
		validateAndPushModifier(varStuff, item);
	}
}

function addFirstLevelVars(nexlVar, varStuff) {
	var index = 0;
	while (index < nexlVar.length) {
		if (isModifierAt(nexlVar, index)) {
			return index;
		}
		if (!j79.isUnescapedCharAt(nexlVar, '$', index)) {
			index++;
			continue;
		}
		var varEndIndex = whereIsVariableEnds(nexlVar, index);
		var varName = nexlVar.substring(index, varEndIndex + 1);
		varStuff.FIRST_LEVEL_VARS.push(varName);
		index = varEndIndex + 1;
	}
}

function extractVarStuff(nexlVar) {
	nexlVar = nexlVar.replace(/^(\${)|}$/g, "");
	var varStuff = {};
	varStuff.MODIFIERS = {};
	varStuff.FIRST_LEVEL_VARS = [];
	var lastIndex = addFirstLevelVars(nexlVar, varStuff);
	varStuff.varName = nexlVar.substring(0, lastIndex);
	var modifiers = nexlVar.substr(lastIndex);
	addModifiers(modifiers, varStuff);
	return varStuff;
}


module.exports.isVarStuffEmpty = isVarStuffEmpty;
module.exports.isDefValueSet = isDefValueSet;
module.exports.obj2Xml = obj2Xml;
module.exports.extractVarStuff = extractVarStuff;