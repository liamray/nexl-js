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


var DEFAULT_GLOBAL_SETTINGS = {
	DEFAULT_DELIMITER: "\n",
	ABORT_ON_UNDEFINED_VAR: true,
	ARGS_ARE_OVERRIDING_SRC: true,
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
function NexlEngine(nexlSource, nexlExpression, externalArgs) {
	// saving state
	this.nexlSource = nexlSource;
	this.nexlExpression = nexlExpression;
	this.externalArgs = externalArgs;

	var savedThis = this;

	// creating context
	this.context = {};
	// this is a bridge function between nexl-source and nexl-engine ( you can call nexl-engine function from nexl sources )
	this.context.evalNexlExpression = function (nexlExpression) {
		return savedThis.evalAndSubstNexlExpressionInner(nexlExpression);
	};
}

NexlEngine.prototype.retrieveSettings = function (name) {
	if (!this.externalArgs || !this.externalArgs.hasOwnProperty(name)) {
		return DEFAULT_GLOBAL_SETTINGS[name];
	}

	return this.externalArgs[name];
};

NexlEngine.prototype.retrieveBoolSettings = function (name) {
	var val = this.retrieveSettings(name);
	return val.toString() == "true";
};

NexlEngine.prototype.retrieveOmitWholeExpression = function (varStuff) {
	if (varStuff.MODIFIERS.OMIT_WHOLE_EXPRESSION != null) {
		return true;
	}
	if (varStuff.MODIFIERS.DONT_OMIT_WHOLE_EXPRESSION != null) {
		return false;
	}
	return this.retrieveBoolSettings('SKIP_UNDEFINED_VARS');
};

NexlEngine.prototype.processIdentifier = function (identifierInfo) {
	var item;
	// todo: dot can be escaped ! ( bug )
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
			this.lastEvalError = util.format('The [%s] function doesn\'t have a close bracket', funcName);
			return;
		}

		var functionCall = identifierInfo.identifier.substring(identifierInfo.start, closeBracket + 1);

		// evaluating the function
		try {
			identifierInfo.value = vm.runInNewContext(functionCall, identifierInfo.value);
			identifierInfo.start += functionCall.length;
			identifierInfo.start++;
		} catch (e) {
			this.lastEvalError = util.format('Failed to evaluate the [%s] function. Reason : %s', functionCall, e);
			identifierInfo.value = null;
			identifierInfo.start = identifierInfo.identifier.length;
		}

		return;
	}

	throw 'You should not achieve this code';
};

NexlEngine.prototype.resolveJSIdentifierValueWrapper = function (identifier) {
	var identifierInfo = {
		identifier: identifier,
		value: this.context,
		start: 0
	};

	// processing identifier
	while (identifierInfo.start < identifier.length && j79.isValSet(identifierInfo.value)) {
		this.processIdentifier(identifierInfo);
	}

	// has it never been in last WHILE cycle ?
	if (identifierInfo.value === this.context) {
		this.lastEvalError = 'It seems you are trying to evaluate zero length variable';
		return null;
	}

	return this.evalAndSubstNexlExpressionInner(identifierInfo.value);
};

// jsVariable can point to object's property, for example : x.y.z
NexlEngine.prototype.resolveJSIdentifierValue = function (jsVariable) {
	// if externalArgs is not provided, just evaluate jsVariable
	if (!this.externalArgs) {
		return this.resolveJSIdentifierValueWrapper(jsVariable);
	}

	// are external arguments weaker than source ?
	if (!this.retrieveBoolSettings('ARGS_ARE_OVERRIDING_SRC')) {
		return this.resolveJSIdentifierValueWrapper(jsVariable);
	}

	// retrieving value from external args
	var result = this.externalArgs[jsVariable];

	// still doesn't have a value ?
	if (!j79.isValSet(result)) {
		return this.resolveJSIdentifierValueWrapper(jsVariable);
	}

	// got an external argument
	// preventing arguments to be evaluated ( i.e. preventing code injection in external arguments )
	// nexl engine evaluates nexl expressions, checking is the result a nexl expression ?
	if (j79.isString(result) && neu.hasFirstLevelVar(result)) {
		throw "You can't pass a nexl expression in external arguments. Escape a $ sign in your argument if you didn't intend to pass an expression";
	}

	return result;
};

NexlEngine.prototype.isContainsValue = function (obj, reversedKey) {
	if (j79.isString(obj)) {
		obj = this.evalAndSubstNexlExpressionInner(obj);
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
			if (this.isContainsValue(obj[i], reversedKey)) {
				return true;
			}
		}
	}
	if (j79.isObject(obj)) {
		for (var key in obj) {
			if (this.isContainsValue(obj[key], reversedKey)) {
				return true;
			}
		}
	}
	return false;
};

NexlEngine.prototype.jsonReverseResolution = function (json, reversedKey) {
	var result = [];
	reversedKey = this.evalAndSubstNexlExpressionInner(reversedKey);
	for (var key in json) {
		var val = json[key];
		if (this.isContainsValue(val, reversedKey)) {
			result.push(key);
		}
	}
	return result.length < 1 ? null : result;
};

NexlEngine.prototype.retrieveDefaultValue = function (defValue) {
	if (!defValue) {
		return null;
	}
	for (var i = 0; i < defValue.length; i++) {
		var item = defValue[i];
		var value = this.evalAndSubstNexlExpressionInner(item);
		if (value !== undefined && value !== null) {
			return neu.unescape(value);
		}
	}
	return null;
};

NexlEngine.prototype.abortErrMsg = function (varStuff, originalVal) {
	var varName = varStuff.varName;
	var msg;

	// was it because of reverse resolution ?
	if (varStuff.MODIFIERS.REVERSE_RESOLUTION && j79.isObject(originalVal)) {
		var value = this.evalAndSubstNexlExpressionInner(varStuff.MODIFIERS.REVERSE_RESOLUTION);
		return util.format('Failed to resolve a KEY by VALUE for [%s] object. The VALUE is [%s]', varName, value);
	}

	msg = "It seems the [" + varName + "] variable is not defined.";
	if (this.lastEvalError) {
		msg += "\nlastEvalError = " + this.lastEvalError;
	}

	return msg;
};

NexlEngine.prototype.abortScriptIfNeeded = function (originalVal, result, varStuff) {
	if (j79.isValSet(result)) {
		return;
	}

	var is2Abort = varStuff.MODIFIERS.ABORT_ON_UNDEF_VAR;
	if (is2Abort == "A") {
		throw this.abortErrMsg(varStuff, originalVal);
	}
	if (is2Abort == "C") {
		return;
	}

	if (this.retrieveBoolSettings('ABORT_ON_UNDEFINED_VAR')) {
		throw this.abortErrMsg(varStuff, originalVal);
	}
};

NexlEngine.prototype.applyTreatAsModifier = function (objCandidate, treatAs, varStuff) {
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
};

NexlEngine.prototype.applyModifiers = function (value, varStuff) {
	var result = value;

	// apply json reverse resolution is present
	if (varStuff.MODIFIERS.REVERSE_RESOLUTION && j79.isObject(result)) {
		result = this.jsonReverseResolution(result, varStuff.MODIFIERS.REVERSE_RESOLUTION);
	}

	// apply json reverse resolution is present
	if (varStuff.MODIFIERS.DELIMITER && j79.isArray(result)) {
		result = result.join(neu.unescapeString(varStuff.MODIFIERS.DELIMITER));
	}

	// apply default value if value not set
	if (!j79.isValSet(result)) {
		result = this.retrieveDefaultValue(varStuff.MODIFIERS.DEF_VALUE);
	}

	// abort script execution if value still not set and [!C] modifier is not applied
	this.abortScriptIfNeeded(value, result, varStuff);

	result = this.applyTreatAsModifier(result, varStuff.MODIFIERS.TREAT_AS, varStuff);

	return result;
};

NexlEngine.prototype.evalNexlVariable = function (varName) {
	var result = [];

	// extracting variable stuff ( modifiers, var name, ... )
	var varStuff = neu.extractVarStuff(varName);

	// varName can contain sub-variables. assembling them if exist ( and we don't need to omit an empty expression )
	var variables = this.evalAndSubstNexlExpressionInner(varStuff.varName, false);

	var isArrayFlag = j79.isArray(variables);

	variables = j79.wrapWithArrayIfNeeded(variables);

	// iterating over variables ( previous iteration in evalAndSubstNexlExpressionInner() can bring more that 1 result )
	for (var i = 0; i < variables.length; i++) {
		var variable = variables[i];

		// evaluating javascript variable
		var evaluatedValue = this.resolveJSIdentifierValue(variable);

		// applying related modifiers
		var values = this.applyModifiers(evaluatedValue, varStuff);

		if (j79.isArray(values)) {
			isArrayFlag = true;
		}

		// accumulating result in [result]
		result = result.concat(values);
	}

	if (!isArrayFlag) {
		result = result[0];
	}

	varStuff.value = result;
	return varStuff;
};

NexlEngine.prototype.substExpressionValues = function (currentResult, chunkPosition, varStuff) {
	var result = [];

	var valueItems = j79.wrapWithArrayIfNeeded(varStuff.value);

	for (var i = 0; i < valueItems.length; i++) {
		var item = valueItems[i];

		for (var j = 0; j < currentResult.length; j++) {
			// cloning a currentResult[j]
			var currentItem = currentResult[j].slice(0); // currentItem is an escapedChunks entity

			// substituting a value
			currentItem[chunkPosition] = item;

			// adding to result
			result.push(currentItem);
		}
	}

	return result;
};

NexlEngine.prototype.evalArray = function (arr) {
	var result = [];

	for (var index in arr) {
		var arrItem = arr[index];
		var item = this.evalAndSubstNexlExpressionInner(arrItem);

		if (j79.isArray(item)) {
			result = result.concat(item)
		} else {
			result.push(item);
		}
	}

	return result;
};

NexlEngine.prototype.evalObject = function (obj) {
	throw 'Still not implemented';
};

NexlEngine.prototype.evalFunction = function (func) {
	throw 'Still not implemented';
};

NexlEngine.prototype.evalString = function (inputAsStr) {
	// extracting first level variables from inputAsStr
	var flvs = neu.extractFirstLevelVars(inputAsStr);

	// assuming that result is a single value at the beginning. but it can be turn out to array
	var isArrayFlag = false;

	// wrapping with array. later, if the isArrayFlag it will be unwrapped back to single element
	var result = [flvs.escapedChunks];

	// iterating over positions to substitute values in escapedChunks
	for (var position in flvs.flvs) {
		var nexlExpression = flvs.flvs[position];

		// evaluating nexl variable
		var varStuff = this.evalNexlVariable(nexlExpression);

		// setting the isArrayFlag to true if we've got an array
		isArrayFlag = isArrayFlag || j79.isArray(varStuff.value);

		// substituting value
		result = this.substExpressionValues(result, position, varStuff);
	}

	// iterating over result and joining all chunks
	var finalResult = [];
	for (var i = 0; i < result.length; i++) {
		if (result[i].length === 1) {
			finalResult.push(result[i][0]);
		} else {
			finalResult.push(result[i].join(''));
		}
	}

	// checking for isArrayFlag
	if (!isArrayFlag) {
		finalResult = finalResult[0];
	}

	return finalResult;
};

NexlEngine.prototype.evalAndSubstNexlExpressionInner = function (input) {
	if (j79.isArray(input)) {
		return this.evalArray(input);
	}

	if (j79.isObject(input)) {
		return this.evalObject(input);
	}

	if (j79.isFunction(input)) {
		return this.evalFunction(input);
	}

	if (j79.isString(input)) {
		return this.evalString(input);
	}

	return input;
};


NexlEngine.prototype.evalAndSubstNexlExpression = function () {
	// assembling nexl source
	var sourceCode = neu.assembleSourceCode(this.nexlSource);

	// evaluating sourceCode in the context
	try {
		vm.runInNewContext(sourceCode, this.context);
	} catch (e) {
		throw "Got a problem with a nexl source : " + e;
	}

	// assembling
	return this.evalAndSubstNexlExpressionInner(this.nexlExpression, false);
};

// exporting evalAndSubstNexlExpression()
module.exports.evalAndSubstNexlExpression = function (nexlSource, nexlExpression, externalArgs) {
	var nexlEngine = new NexlEngine(nexlSource, nexlExpression, externalArgs);
	return nexlEngine.evalAndSubstNexlExpression();
};

// exporting 'settings-list'
module.exports['settings-list'] = Object.keys(DEFAULT_GLOBAL_SETTINGS);

// exporting resolveJsVariables
module.exports.resolveJsVariables = neu.resolveJsVariables;
