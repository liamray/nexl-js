/**************************************************************************************
 nexl-engine

 Copyright (c) 2016 Yevgeny Sergeyev
 License : Apache 2.0

 nexl expressions processor
 **************************************************************************************/

const esprima = require('esprima');
const path = require('path');
const util = require('util');
const fs = require('fs');
const vm = require('vm');
const j79 = require('j79-utils');

module.exports = (function () {
	var MODIFIERS = {
		"DELIMITER": "?",
		"DEF_VALUE": ":",
		"DONT_OMIT_WHOLE_EXPRESSION": "+",
		"OMIT_WHOLE_EXPRESSION": "-",
		"ABORT_ON_UNDEF_VAR": "!",
		"TREAT_AS": "~",
		"REVERSE_RESOLUTION": "<"
	};

	/**
	 * global settings for nexl script evaluation
	 * you can override it by specifying the name of setting as external argument
	 * for example : evalNexlExpression(src, expression, { DEFAULT_DELIMITER: ',' });
	 * which means to change the default delimiter to , character
	 */
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
			throw "nexlSource is not provided";
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


	/**
	 * nexlSource is a javascript which describes you data model
	 * can be provided as text or file ( nexlSource is object )
	 * to provide as text : nexlSource.asText.text, nexlSource.asText.path4imports ( optional )
	 * to provide as file : nexlSource.asFile.fileName

	 * nexlExpression is a nexl language expression to access data from nexlSource
	 * ( for example, to access HOSTS variable in javascript, use the following expression : ${HOSTS} )

	 * externalArgs is to override javascript variables in nexlSource ( optional )
	 */
	function evalNexlExpression(nexlSource, nexlExpression, externalArgs) {
		var lastEvalError;
		var context;

		function isContainsValue(obj, reversedKey) {
			if (j79.isString(obj)) {
				obj = assembleExpressionWrapper(obj);
			}
			if (j79.isArray(obj) && obj.length == 1) {
				obj = obj[0];
			}
			if (j79.isString(obj) || j79.isInt(obj) || j79.isBool(obj)) {
				for (var i = 0; i < reversedKey.length; i++) {
					var item = unescape(reversedKey[i]);
					if (item == obj.toString()) {
						return true;
					}
				}
			}
			if (j79.isArray(obj)) {
				for (var i = 0; i < obj.length; i++) {
					if (isContainsValue(obj[i], reversedKey)) {
						return true;
					}
				}
			}
			if (j79.isObject(obj)) {
				for (var key in obj) {
					if (isContainsValue(obj[key], reversedKey)) {
						return true;
					}
				}
			}
			return false;
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

		function retrieveSettings(name) {
			if (!externalArgs || !externalArgs.hasOwnProperty(name)) {
				return GLOBAL_SETTINGS[name];
			}

			return externalArgs[name];
		}

		function retrieveBoolSettings(name) {
			var val = retrieveSettings(name);
			return val.toString() == "true";
		}

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

		function init() {
			assembleModifiersRegex();
		}

		function abortErrMsg(varStuff, originalVal) {
			var varName = varStuff.varName;
			var msg;

			// was it because of reverse resolution ?
			if (varStuff.MODIFIERS.REVERSE_RESOLUTION && j79.isObject(originalVal)) {
				var value = assembleExpressionWrapper(varStuff.MODIFIERS.REVERSE_RESOLUTION);
				return util.format('Failed to resolve a KEY by VALUE for [%s] object. The VALUE is [%s]', varName, value);
			}

			msg = "It seems the [" + varName + "] variable is not defined.";
			if (lastEvalError) {
				msg += "\nlastEvalError = " + lastEvalError;
			}

			return msg;
		}

		function processIdentifier(identifierInfo) {
			var item;
			var dotPos = identifierInfo.identifier.indexOf('.', identifierInfo.start);
			var bracketPos = identifierInfo.identifier.indexOf('(', identifierInfo.start);

			// 1) no dots no brackets
			if (dotPos < 0 && bracketPos < 0) {
				// cutting the item for resolving from start till the end
				item = identifierInfo.identifier.substr(identifierInfo.start);
				item = unescapeString(item);
				// resolving
				identifierInfo.value = identifierInfo.value[item];
				identifierInfo.start = identifierInfo.identifier.length;
				return;
			}

			// 2) dotPos is positive and before bracketPos
			if (dotPos >= identifierInfo.start && (bracketPos < 0 || dotPos < bracketPos)) {
				// is empty identifier ?
				if (dotPos == identifierInfo.start) {
					// skipping the dot
					identifierInfo.start++;
					return;
				}

				// cutting the item for resolving from start till dotPos
				item = identifierInfo.identifier.substring(identifierInfo.start, dotPos);
				item = unescapeString(item);
				identifierInfo.value = identifierInfo.value[item];
				identifierInfo.start = dotPos + 1;
				return;
			}

			// 3) bracketPos is positive and before dotPos
			if (bracketPos >= identifierInfo.start && ( dotPos < 0 || bracketPos < dotPos )) {
				// probably it's a function call
				// cutting the item from start till bracketPos
				var funcName = identifierInfo.identifier.substring(identifierInfo.start, bracketPos);
				funcName = unescapeString(funcName);
				var resolution = identifierInfo.value[funcName];
				// is it not function ?
				if (!j79.isFunction(resolution)) {
					dotPos = dotPos < 0 ? identifierInfo.identifier.length : dotPos;
					item = identifierInfo.identifier.substring(identifierInfo.start, dotPos);
					item = unescapeString(item);
					identifierInfo.value = identifierInfo.value[item];
					identifierInfo.start = dotPos + 1;
					return;
				}

				// omg ! it's function !
				// searching for close bracket
				var closeBracket = findCloseBracketPos(identifierInfo.identifier, identifierInfo.start + funcName.length);

				// didn't find a close bracket ?
				if (closeBracket < 0) {
					identifierInfo.value = null;
					identifierInfo.start = identifierInfo.identifier.length;
					lastEvalError = util.format('The [%s] function doesn\'t have a close bracket', funcName);
					return;
				}

				var functionCall = identifierInfo.identifier.substring(identifierInfo.start, closeBracket + 1);

				// evaluating the function
				try {
					identifierInfo.value = vm.runInNewContext(functionCall, identifierInfo.value);
					identifierInfo.start += functionCall.length;
					identifierInfo.start++;
				} catch (e) {
					lastEvalError = util.format('Failed to evaluate the [%s] function. Reason : %s', functionCall, e);
					identifierInfo.value = null;
					identifierInfo.start = identifierInfo.identifier.length;
				}

				return;
			}

			throw 'You should not achieve this code';
		}

		function resolveJSIdentifierValueWrapper(identifier) {
			var identifierInfo = {
				identifier: identifier,
				value: context,
				start: 0
			};

			// processing identifier
			while (identifierInfo.start < identifier.length && j79.isValSet(identifierInfo.value)) {
				processIdentifier(identifierInfo);
			}

			// has it never been in last WHILE cycle ?
			if (identifierInfo.value === context) {
				lastEvalError = 'It seems you are trying to evaluate zero length variable';
				return null;
			}

			return identifierInfo.value;
		}

		// jsVariable can point to object's property, for example : x.y.z
		function resolveJSIdentifierValue(jsVariable) {
			// if externalArgs is not provided, just evaluate jsVariable
			if (!externalArgs) {
				return resolveJSIdentifierValueWrapper(jsVariable);
			}

			// are external arguments weaker than source ?
			if (!retrieveBoolSettings('ARGS_ARE_OVERRIDING_SRC')) {
				return resolveJSIdentifierValueWrapper(jsVariable);
			}

			// retrieving value from external args
			var result = externalArgs[jsVariable];

			// still doesn't have a value ?
			if (!j79.isValSet(result)) {
				return resolveJSIdentifierValueWrapper(jsVariable);
			}

			// got an external argument
			// preventing arguments to be evaluated ( i.e. preventing code injection in external arguments )
			// nexl engine evaluates nexl expressions, checking is the result a nexl expression ?
			if (j79.isString(result) && hasFirstLevelVars(result)) {
				throw "You can't pass a nexl expression in external arguments. Escape a $ sign in your argument if you didn't intend to pass an expression";
			}

			return result;
		}

		function evalNexlVariable(varName) {
			var result = [];

			// extracting variable stuff ( modifiers, var name, ... )
			var varStuff = extractVarStuff(varName);

			// varName can contain sub-variables. assembling them if exist ( and we don't need to omit an empty expression )
			var variables = assembleExpressionWrapper(varStuff.varName, false);

			// retrieving the OMIT_WHOLE_EXPRESSION/DONT_OMIT_WHOLE_EXPRESSION modifier value
			var isOmitWholeExpression = retrieveOmitWholeExpression(varStuff);

			// iterating over variables ( previous iteration in assembleExpression() can bring more that 1 result )
			for (var i = 0; i < variables.length; i++) {
				var variable = variables[i];

				// evaluating javascript variable
				var evaluatedValue = resolveJSIdentifierValue(variable);

				// applying related modifiers
				var values = applyModifiers(evaluatedValue, varStuff);

				// iterating over values and accumulating result in [result]
				for (var j = 0; j < values.length; j++) {
					var item = values[j];

					if (item == null) {
						if (!isOmitWholeExpression) {
							result.push(null);
						}
						continue;
					}

					// value can contain sub-variables, so assembling them
					var items = assembleExpressionWrapper(item, isOmitWholeExpression);

					if (items.length == 1 && items[0] == null) {
						if (!isOmitWholeExpression) {
							result.push(null);
						}
						continue;
					}

					// accumulating result in [result]
					result = result.concat(items);
				}
			}

			varStuff.value = result;
			return varStuff;
		}

		function jsonReverseResolution(json, reversedKey) {
			var result = [];
			reversedKey = assembleExpressionWrapper(reversedKey);
			for (var key in json) {
				var val = json[key];
				if (isContainsValue(val, reversedKey)) {
					result.push(key);
				}
			}
			return result.length < 1 ? null : result;
		}

		function obj2Xml(objCandidate) {
			throw '~X modifier still not implemented';
		}

		function applyTreatAsModifier(objCandidate, treatAs, varStuff) {
			// force make object
			if (treatAs === 'O') {
				var result = j79.wrapWithObjIfNeeded(objCandidate, varStuff.varName);
				return JSON.stringify(result);
			}

			if (!j79.isObject(objCandidate)) {
				return objCandidate;
			}

			switch (treatAs) {
				// keys
				case 'K': {
					return Object.keys(objCandidate);
				}

				// values
				case 'V': {
					return j79.obj2ArrayIfNeeded(objCandidate);
				}

				// as xml
				case 'X' : {
					return obj2Xml(objCandidate);
				}
			}

			return JSON.stringify(objCandidate);
		}

		function applyModifiers(value, varStuff) {
			var result = value;

			// apply json reverse resolution is present
			if (varStuff.MODIFIERS.REVERSE_RESOLUTION && j79.isObject(value)) {
				result = jsonReverseResolution(value, varStuff.MODIFIERS.REVERSE_RESOLUTION);
			}

			// apply default value if value not set
			if (!j79.isValSet(result)) {
				result = retrieveDefaultValue(varStuff.MODIFIERS.DEF_VALUE);
			}

			// abort script execution if value still not set and [!C] modifier is not applied
			abortScriptIfNeeded(value, result, varStuff);

			result = applyTreatAsModifier(result, varStuff.MODIFIERS.TREAT_AS, varStuff);

			result = j79.wrapWithArrayIfNeeded(result);
			return result;
		}

		function abortScriptIfNeeded(originalVal, result, varStuff) {
			if (j79.isValSet(result)) {
				return;
			}

			var is2Abort = varStuff.MODIFIERS.ABORT_ON_UNDEF_VAR;
			if (is2Abort == "A") {
				throw abortErrMsg(varStuff, originalVal);
			}
			if (is2Abort == "C") {
				return;
			}

			if (retrieveBoolSettings('ABORT_ON_UNDEFINED_VAR')) {
				throw abortErrMsg(varStuff, originalVal);
			}
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

		function retrieveDefaultValue(defValue) {
			if (!defValue) {
				return null;
			}
			for (var i = 0; i < defValue.length; i++) {
				var item = defValue[i];
				var value = assembleExpressionWrapper(item);
				if (isDefValueSet(value)) {
					return unescape(value);
				}
			}
			return null;
		}

		function retrieveOmitWholeExpression(varStuff) {
			if (varStuff.MODIFIERS.OMIT_WHOLE_EXPRESSION != null) {
				return true;
			}
			if (varStuff.MODIFIERS.DONT_OMIT_WHOLE_EXPRESSION != null) {
				return false;
			}
			return retrieveBoolSettings('SKIP_UNDEFINED_VARS');
		}

		function isVarStuffEmpty(varStuff) {
			return varStuff.value.length == 0 || ( varStuff.value.length == 1 && varStuff.value[0] == null );
		}

		// when items are joined into one string separated by [delimiter]
		function substituteFlat(expression, searchVal, replaceVal, delimiter, result) {
			var preResult = [];

			// iterating over replace values and aggregating them in [preResult]
			for (var i = 0; i < replaceVal.length; i++) {
				var item = replaceVal[i];

				// replacing null with empty string
				item = (item == null) ? "" : item;

				// adding
				preResult.push(item);
			}

			// joining all
			preResult = preResult.join(delimiter);

			// substituted values with [delimiter]
			preResult = j79.replaceAll(expression, searchVal, preResult);

			// adding to [result]
			result.push(preResult);
		}

		// this is default behaviour when all items are joined as array
		function substituteVertical(expression, searchVal, replaceVal, result) {
			for (var i = 0; i < replaceVal.length; i++) {
				var item = replaceVal[i];

				// expression is same as search value and item is null
				// this is done to push real [null] values to result, otherwise stringified null is pushed ['null']
				if (expression == searchVal && item == null) {
					result.push(null);
					continue;
				}

				// replacing [null] with empty string to perform substitute
				item = (item == null) ? "" : item;

				// substituting
				item = j79.replaceAll(expression, searchVal, item);

				result.push(item);
			}
		}

		function substExpressionValues(expression, searchVal, varStuff) {
			var result = [];

			// discovering delimiter
			var delimiter = varStuff.MODIFIERS.DELIMITER;
			delimiter = unescape(delimiter);
			delimiter = j79.isValSet(delimiter) ? delimiter : retrieveSettings('DEFAULT_DELIMITER');

			// preparing replaceVal
			var replaceVal = isVarStuffEmpty(varStuff) ? [null] : j79.wrapWithArrayIfNeeded(varStuff.value);

			// iterating over expression ( expression can be array ) and substituting [replaceVal]
			for (var i = 0; i < expression.length; i++) {

				var item = expression[i];

				if (delimiter == "\n") {
					// every value is pushed to [result]
					substituteVertical(item, searchVal, replaceVal, result);
				} else {
					// all values are aggregated in one string and then this final string is pushed to [result]
					substituteFlat(item, searchVal, replaceVal, delimiter, result);
				}

			}

			return result;
		}

		// extracts the first level variable ( only first item )
		function extractFirstLevelVarWrapper(str) {
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

			var closeBracketPos = findCloseBracketPos(str, start + 1);
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
			var oneFlv = extractFirstLevelVarWrapper(str);
			while (oneFlv != null) {
				result.push(oneFlv.flvName);
				str = oneFlv.restStr;
				oneFlv = extractFirstLevelVarWrapper(str);
			}
			return result;
		}

		function hasFirstLevelVars(str) {
			return extractFirstLevelVarWrapper(str) != null;
		}

		function findCloseBracketPos(str, start) {
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
			if (str.length < index + 4) {
				throw "Invalid variable declaration. Variable length seems to short. Variable is [" + str + "]";
			}
			if (str.charAt(index + 1) != '{') {
				throw "Bad expression. In the [" + str + "] at the " + index + " position should be an open bracket";
			}

			var closeBracketPos = findCloseBracketPos(str, index + 1);
			if (closeBracketPos < 0) {
				throw "Variable [" + str + "] is not closed with right bracket";
			}

			return closeBracketPos;
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

		function assembleExpressionWrapper(expression, isOmitWholeExpression) {
			// converting expression to string if needed
			if (!j79.isString(expression)) {
				expression = expression.toString();
			}

			var result = [expression];

			// extracting first level variables from expression
			var flvs = extractFirstLevelVars(expression);

			// iterating over first level variables, evaluating, substituting to [result]
			for (var i = 0; i < flvs.length; i++) {
				// first level variable
				var flv = flvs[i];

				// evaluating nexl variable
				var varStuff = evalNexlVariable(flv);

				// if [isOmitWholeExpression] is ON and [varStuff.value] is empty, omitting the whole expression
				if (isOmitWholeExpression && isVarStuffEmpty(varStuff)) {
					return [null];
				}

				// substituting value
				result = substExpressionValues(result, flv, varStuff);
			}

			return result;
		}

		var sourceCode = assembleSourceCode(nexlSource);

		context = {};
		context.evalNexlExpression = assembleExpressionWrapper;

		try {
			vm.runInNewContext(sourceCode, context);
		} catch (e) {
			throw "Got a problem with a source script: " + e;
		}

		// attaching a assembleExpressionWrapper() function to a context
		context.evalNexlExpression = assembleExpressionWrapper;

		// initializing
		init();

		// assembling
		return assembleExpressionWrapper(nexlExpression, false);
	}

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

	return {
		evalNexlExpression: evalNexlExpression,
		'settings-list': Object.keys(GLOBAL_SETTINGS),
		resolveJsVariables: resolveJsVariables
	};
}());