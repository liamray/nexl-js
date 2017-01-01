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
const neu = require('./nexl-engine-utils');

module.exports = (function () {
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
					var item = neu.unescape(reversedKey[i]);
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
				item = neu.unescapeString(item);
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
				item = neu.unescapeString(item);
				identifierInfo.value = identifierInfo.value[item];
				identifierInfo.start = dotPos + 1;
				return;
			}

			// 3) bracketPos is positive and before dotPos
			if (bracketPos >= identifierInfo.start && ( dotPos < 0 || bracketPos < dotPos )) {
				// probably it's a function call
				// cutting the item from start till bracketPos
				var funcName = identifierInfo.identifier.substring(identifierInfo.start, bracketPos);
				funcName = neu.unescapeString(funcName);
				var resolution = identifierInfo.value[funcName];
				// is it not function ?
				if (!j79.isFunction(resolution)) {
					dotPos = dotPos < 0 ? identifierInfo.identifier.length : dotPos;
					item = identifierInfo.identifier.substring(identifierInfo.start, dotPos);
					item = neu.unescapeString(item);
					identifierInfo.value = identifierInfo.value[item];
					identifierInfo.start = dotPos + 1;
					return;
				}

				// omg ! it's function !
				// searching for close bracket
				var closeBracket = neu.findClosestBracketPos(identifierInfo.identifier, identifierInfo.start + funcName.length);

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
			if (j79.isString(result) && neu.hasFirstLevelVars(result)) {
				throw "You can't pass a nexl expression in external arguments. Escape a $ sign in your argument if you didn't intend to pass an expression";
			}

			return result;
		}

		function evalNexlVariable(varName) {
			var result = [];

			// extracting variable stuff ( modifiers, var name, ... )
			var varStuff = neu.extractVarStuff(varName);

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
					return neu.obj2Xml(objCandidate);
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

		function retrieveDefaultValue(defValue) {
			if (!defValue) {
				return null;
			}
			for (var i = 0; i < defValue.length; i++) {
				var item = defValue[i];
				var value = assembleExpressionWrapper(item);
				if (neu.isDefValueSet(value)) {
					return neu.unescape(value);
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
			delimiter = neu.unescape(delimiter);
			delimiter = j79.isValSet(delimiter) ? delimiter : retrieveSettings('DEFAULT_DELIMITER');

			// preparing replaceVal
			var replaceVal = neu.isVarStuffEmpty(varStuff) ? [null] : j79.wrapWithArrayIfNeeded(varStuff.value);

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

		function assembleExpressionWrapper(expression, isOmitWholeExpression) {
			// converting expression to string if needed
			if (!j79.isString(expression)) {
				expression = expression.toString();
			}

			var result = [expression];

			// extracting first level variables from expression
			var flvs = neu.extractFirstLevelVars(expression);

			// iterating over first level variables, evaluating, substituting to [result]
			for (var i = 0; i < flvs.length; i++) {
				// first level variable
				var flv = flvs[i];

				// evaluating nexl variable
				var varStuff = evalNexlVariable(flv);

				// if [isOmitWholeExpression] is ON and [varStuff.value] is empty, omitting the whole expression
				if (isOmitWholeExpression && neu.isVarStuffEmpty(varStuff)) {
					return [null];
				}

				// substituting value
				result = substExpressionValues(result, flv, varStuff);
			}

			return result;
		}

		function start() {
			var sourceCode = neu.assembleSourceCode(nexlSource);

			context = {};
			context.evalNexlExpression = assembleExpressionWrapper;

			try {
				vm.runInNewContext(sourceCode, context);
			} catch (e) {
				throw "Got a problem with a source script: " + e;
			}

			// attaching a assembleExpressionWrapper() function to a context
			context.evalNexlExpression = assembleExpressionWrapper;

			// assembling
			return assembleExpressionWrapper(nexlExpression, false);
		}

		return start();
	}

	return {
		evalNexlExpression: evalNexlExpression,
		'settings-list': Object.keys(GLOBAL_SETTINGS),
		resolveJsVariables: neu.resolveJsVariables
	}
}());