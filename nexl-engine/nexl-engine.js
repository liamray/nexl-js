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


	// adding nexl stuff to the context
	this.context.nexl = {};

	// giving access to arguments to functions in nexl-sources
	this.context.nexl.args = externalArgs;

	// proxy function to give an access to the functions in nexl-sources
	this.context.nexl.processItem = function (nexlExpression, args) {
		return savedThis.processItemInner(nexlExpression, args);
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

NexlEngine.prototype.evalNexlExpressionInner3 = function (identifierInfo) {
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

NexlEngine.prototype.evalNexlExpressionInner2 = function (identifier, varStuff) {
	var identifierInfo = {
		identifier: identifier,
		value: this.context,
		start: 0
	};

	// processing identifier
	while (identifierInfo.start < identifier.length && j79.isValSet(identifierInfo.value)) {
		this.evalNexlExpressionInner3(identifierInfo);
	}

	// has it never been in last WHILE cycle ?
	if (identifierInfo.value === this.context) {
		this.lastEvalError = 'It seems you are trying to evaluate zero length variable';
		return null;
	}

	var isOmit = NexlEngine.prototype.retrieveOmitWholeExpression(varStuff);

	return this.processItemInner(identifierInfo.value, null, isOmit);
};

// jsVariable can point to object's property, for example : x.y.z
NexlEngine.prototype.evalNexlExpressionInner1 = function (jsVariable, varStuff) {
	// if externalArgs is not provided, just evaluate jsVariable
	if (!this.externalArgs) {
		return this.evalNexlExpressionInner2(jsVariable, varStuff);
	}

	// are external arguments weaker than source ?
	if (!this.retrieveBoolSettings('ARGS_ARE_OVERRIDING_SRC')) {
		return this.evalNexlExpressionInner2(jsVariable, varStuff);
	}

	// retrieving value from external args
	var result = this.externalArgs[jsVariable];

	// still doesn't have a value ?
	if (!j79.isValSet(result)) {
		return this.evalNexlExpressionInner2(jsVariable, varStuff);
	}

	// got an external argument
	// preventing arguments to be evaluated ( i.e. preventing code injection in external arguments )
	// nexl engine evaluates nexl expressions, checking is the result a nexl expression ?
	if (j79.isString(result) && neu.hasFirstLevelVar(result)) {
		throw "You can't pass a nexl expression in external arguments. Escape a $ sign in your argument if you didn't intend to pass an expression";
	}

	return result;
};

NexlEngine.prototype.isContainsValue = function (val, reversedKey) {
	if (j79.isArray(val)) {
		for (var i = 0; i < val.length; i++) {
			if (this.isContainsValue(val[i], reversedKey)) {
				return true;
			}
		}

		return false;
	}

	if (j79.isObject(val)) {
		for (var key in val) {
			if (this.isContainsValue(val[key], reversedKey)) {
				return true;
			}
		}

		return false;
	}

	var reverseKeyWrappedWithArray = j79.wrapWithArrayIfNeeded(reversedKey);

	for (var i = 0; i < reverseKeyWrappedWithArray.length; i++) {
		if (reverseKeyWrappedWithArray[i] === val) {
			return true;
		}
	}

	return false;
};

NexlEngine.prototype.objectReverseResolution = function (obj, reversedKey) {
	var result = [];
	// evaluating reverseKey
	var reversedKeyEvaluated = this.processItemInner(reversedKey);

	if (j79.isObject(reversedKeyEvaluated) || j79.isFunction(reversedKey)) {
		throw util.format('Object resolution by object/function is not implemented yet. reverseKey = [%s], reverseKeyEvaluated = [%s], object = [%s]', reversedKey, reversedKeyEvaluated, JSON.stringify(obj));
	}

	for (var key in obj) {
		var val = obj[key];
		if (this.isContainsValue(val, reversedKeyEvaluated)) {
			result.push(key);
		}
	}

	result = result.length === 1 ? result[0] : result;
	return result.length < 1 ? null : result;
};

NexlEngine.prototype.retrieveDefaultValue = function (defValue) {
	if (!defValue) {
		return null;
	}
	for (var i = 0; i < defValue.length; i++) {
		var item = defValue[i];
		var value = this.processItemInner(item);
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
		var value = this.processItemInner(varStuff.MODIFIERS.REVERSE_RESOLUTION);
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

NexlEngine.prototype.applyOmitModifier = function (result, varStuff) {
	var isOmit = NexlEngine.prototype.retrieveOmitWholeExpression(varStuff);
	if (!isOmit) {
		return result;
	}

	// omitting null values from array
	if (j79.isArray(result)) {
		for (var i = 0; i < result.length; i++) {
			if (result[i] === null) {
				result.splice(i, 1);
				i--;
			}
		}

		return result;
	}

	// todo: omitting null values from obj
	if (j79.isObject(result)) {
		return result;
	}

	return result;
};

NexlEngine.prototype.applyObjectReverseResolutionModifier = function (result, varStuff) {
	if (varStuff.MODIFIERS.REVERSE_RESOLUTION && j79.isObject(result)) {
		return this.objectReverseResolution(result, varStuff.MODIFIERS.REVERSE_RESOLUTION);
	}

	return result;
};

NexlEngine.prototype.applyConcatArrayElementsModifier = function (result, varStuff) {
	// apply json reverse resolution is present
	if (varStuff.MODIFIERS.DELIMITER && j79.isArray(result)) {
		return result.join(neu.unescapeString(varStuff.MODIFIERS.DELIMITER));
	}

	return result;
};

NexlEngine.prototype.applyDefaultValueModifier = function (result, varStuff) {
	// apply default value if value not set
	if (!j79.isValSet(result)) {
		return this.retrieveDefaultValue(varStuff.MODIFIERS.DEF_VALUE);
	}

	return result;
};

NexlEngine.prototype.applyTreatAsModifier = function (objCandidate, varStuff) {
	var treatAs = varStuff.MODIFIERS.TREAT_AS;

	// is objCandidate not an object ?
	if (!j79.isObject(objCandidate)) {
		// should we treat it as object ?
		if (treatAs === 'O') {
			// treat it as object ( i.e. wrap with object )
			return j79.wrapWithObjIfNeeded(objCandidate, varStuff.varName);
		} else {
			return objCandidate;

		}
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

	return objCandidate;
};

NexlEngine.prototype.applyModifiers = function (value, varStuff) {
	var result = value;

	// applying OMIT_WHOLE_EXPRESSION modifier
	result = this.applyOmitModifier(result, varStuff);

	// applying object reverse resolution modifier
	result = this.applyObjectReverseResolutionModifier(result, varStuff);

	// apply treat as modifier
	result = this.applyTreatAsModifier(result, varStuff);

	// applying concat array elements modifier
	result = this.applyConcatArrayElementsModifier(result, varStuff);

	// applying default value modifier
	result = this.applyDefaultValueModifier(result, varStuff);

	// abort script execution if value still not set and [!C] modifier is not applied
	this.abortScriptIfNeeded(value, result, varStuff);

	return result;
};

// evaluates nexl expression like ${test:1}
// todo: take in account a !AA, !CC new modifiers
NexlEngine.prototype.evalNexlExpressionNew = function (nexlExpression) {
	// extracting variable stuff ( modifiers, var name, ... )
	var varStuff = neu.extractVarStuff(nexlExpression);
};

NexlEngine.prototype.evalNexlExpression = function (nexlExpression) {
	var result = [];

	// extracting variable stuff ( modifiers, var name, ... )
	var varStuff = neu.extractVarStuff(nexlExpression);

	// nexlExpression can contain sub-variables. assembling them if exist ( and we don't need to omit an empty expression )
	var variables = this.processItemInner(varStuff.varName, false);

	var isArrayFlag = j79.isArray(variables);

	variables = j79.wrapWithArrayIfNeeded(variables);

	// iterating over variables ( previous iteration in processItemInner() can bring more that 1 result )
	for (var i = 0; i < variables.length; i++) {
		var variable = variables[i];

		// evaluating javascript variable
		var evaluatedValue = this.evalNexlExpressionInner1(variable, varStuff);

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

NexlEngine.prototype.processArrayItem = function (arr) {
	var result = [];

	for (var index in arr) {
		var arrItem = arr[index];
		var item = this.processItemInner(arrItem);

		if (j79.isArray(item)) {
			result = result.concat(item)
		} else {
			result.push(item);
		}
	}

	return result;
};

NexlEngine.prototype.processObjectItem = function (obj) {
	var result = {};

	// iterating over over keys:values and evaluating
	for (var key in obj) {
		var evaluatedKey = this.processItemInner(key);
		if (j79.isArray(evaluatedKey) || j79.isObject(evaluatedKey) || j79.isFunction(evaluatedKey)) {
			var type = j79.getType(evaluatedKey);
			throw util.format('Can\'t assemble JavaScript object. The [%s] key is evaluated to a [%s] value which is not a primitive data type ( it has a [%s] data type )', key, JSON.stringify(evaluatedKey), type);
		}

		var value = obj[key];
		var evaluatedValue = this.processItemInner(value);

		result[evaluatedKey] = evaluatedValue;
	}

	return result;
};

NexlEngine.prototype.processFunctionItem = function (func) {
	throw 'Still not implemented';
};

NexlEngine.prototype.processStringItemNew = function (inputAsStr, isOmit) {
	var fle = neu.extractFirstLevelExpressions(inputAsStr);
};

NexlEngine.prototype.processStringItem = function (inputAsStr, isOmit) {
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
		var varStuff = this.evalNexlExpression(nexlExpression);

		// is to omit the inputAsStr expression if the value is null
		if (varStuff.value === null && isOmit) {
			return '';
		}

		// setting the isArrayFlag to true if we've got an array
		isArrayFlag = isArrayFlag || j79.isArray(varStuff.value);

		// substituting value
		result = this.substExpressionValues(result, position, varStuff);
	}

	// iterating over result and joining all chunks ( all chunks are joining as strings ! )
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
		// it wasn't array at the beginning, extracting the first element from array ( it has only 1 element )
		finalResult = finalResult[0];
	}

	return finalResult;
};

// todo: take in account args parameter ( implement it )
NexlEngine.prototype.processItemInner = function (input, args, isOmit) {
	// iterates over each array element and evaluates every item
	if (j79.isArray(input)) {
		return this.processArrayItem(input);
	}

	if (j79.isObject(input)) {
		return this.processObjectItem(input);
	}

	if (j79.isFunction(input)) {
		return this.processFunctionItem(input);
	}

	// actually only string elements are really evaluable
	if (j79.isString(input)) {
		return this.processStringItem(input, isOmit);
	}

	// all another primitives are not evaluable, returning it as is
	return input;
};


NexlEngine.prototype.processItem = function () {
	// assembling nexl source
	var sourceCode = neu.assembleSourceCode(this.nexlSource);

	// evaluating sourceCode in the context
	try {
		vm.runInNewContext(sourceCode, this.context);
	} catch (e) {
		throw "Got a problem with a nexl source : " + e;
	}

	// assembling
	// todo: may be pass the real args ? consider this situation
	return this.processItemInner(this.nexlExpression, null, false);
};

// exporting processItem()
module.exports.processItem = function (nexlSource, nexlExpression, externalArgs) {
	var nexlEngine = new NexlEngine(nexlSource, nexlExpression, externalArgs);
	return nexlEngine.processItem();
};

// exporting 'settings-list'
module.exports['settings-list'] = Object.keys(DEFAULT_GLOBAL_SETTINGS);

// exporting resolveJsVariables
module.exports.resolveJsVariables = neu.resolveJsVariables;
