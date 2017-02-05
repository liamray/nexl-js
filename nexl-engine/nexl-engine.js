/**************************************************************************************
 nexl-engine

 Copyright (c) 2016-2017 Yevgeny Sergeyev
 License : Apache 2.0

 nexl expressions processor
 **************************************************************************************/

const util = require('util');
const j79 = require('j79-utils');
const nsu = require('./nexl-source-utils');
const nep = require('./nexl-expressions-parser');


var DEFAULT_GLOBAL_SETTINGS = {
	DEFAULT_DELIMITER: "\n",
	ABORT_ON_UNDEFINED_VAR: true,
	ARGS_ARE_OVERRIDING_SRC: true,
	SKIP_UNDEFINED_VARS: false
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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function isObjectOrFunction(item) {
	return j79.isObject(item) || j79.isFunction(item);
}

function isObjectFunctionOrArray(item) {
	return isObjectOrFunction(item) || j79.isArray(item);
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EvalAndSubstChunks
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

EvalAndSubstChunks.prototype.validate = function (chunk2Substitute, item) {
	if (!j79.isValSet(item)) {
		throw util.format('Cannot substitute [%s] value into [%s]', item, chunk2Substitute.str);
	}

	if (isObjectFunctionOrArray(item)) {
		throw util.format('The subexpression [%s] of [%s] expression cannot be evaluated as %s ( must be a primitive or array of primitives )', chunk2Substitute.str, this.data.str, j79.getType(item));
	}
};

EvalAndSubstChunks.prototype.validateAndSubstitute = function (chunk2Substitute, values, pos) {
	var newResult = [];

	for (var i = 0; i < values.length; i++) {
		var item = values[i];

		this.validate(chunk2Substitute, item);

		for (var j = 0; j < this.result.length; j++) {
			// cloning array
			var currentItem = this.result[j].slice(0);

			// substituting value
			currentItem[pos] = item;

			// adding to new result
			newResult.push(currentItem);
		}
	}

	this.result = newResult;
};


EvalAndSubstChunks.prototype.evalAndSubstChunksInner = function () {
	// cloning chunks array and wrapping with additional array
	this.result = [this.data.chunks.slice(0)];

	// tells if additional array should remain
	var isArrayFlag = false;

	// iterating over chunkSubstitutions
	for (var pos in this.data.chunkSubstitutions) {
		// current chunk ( which is parsed nexl expression itself )
		var chunk2Substitute = this.data.chunkSubstitutions[pos];

		// evaluating this chunk
		// chunkValue must be a primitive or array of primitives. can't be object|function or array of objects|functions|arrays
		var chunkValue = new NexlExpressionEvaluator(this.session, chunk2Substitute).eval();

		// wrapping with array
		var chunkValues = j79.wrapWithArrayIfNeeded(chunkValue);

		// validating and substituting chunkValue to result
		this.validateAndSubstitute(chunk2Substitute, chunkValues, pos);
	}

	var finalResult = [];
	// iterating over additional array and joining chunks
	for (var i = 0; i < this.result.length; i++) {
		var item = this.result[i];
		if (item.length === 1) {
			item = item[0];
		} else {
			item = item.join('');
		}
		finalResult.push(item);
	}

	if (finalResult.length === 1 && !isArrayFlag) {
		finalResult = finalResult[0];
	}

	if (finalResult === this.session.context) {
		return null;
	}

	return finalResult;
};

EvalAndSubstChunks.prototype.throwParserErrorIfNeeded = function (condition, errorMessage) {
	if (condition) {
		throw errorMessage;
	}
};

EvalAndSubstChunks.prototype.evalAndSubstChunks = function () {
	var chunksCnt = this.data.chunks.length;
	var chunkSubstitutionsCnt = Object.keys(this.data.chunkSubstitutions).length;

	// no chunks ? do get a null !
	if (chunksCnt < 1) {
		this.throwParserErrorIfNeeded(chunkSubstitutionsCnt !== 0, util.format('Parser error ! Got a chunkSubstitutionsCnt = %s when the chunksCnt = %s for [%s] expression', chunkSubstitutionsCnt, chunksCnt, this.data.str));
		return null;
	}

	// when there is nothing to substitute, return just the one item from chunks
	if (chunkSubstitutionsCnt < 1) {
		this.throwParserErrorIfNeeded(chunksCnt > 1, util.format('Parser error ! Got a chunkSubstitutionsCnt = %s when the chunksCnt = %s for [%s] expression', chunkSubstitutionsCnt, chunksCnt, this.data.str));
		return this.data.chunks[0];
	}

	// when we have the only 1 item to substitute
	if (this.data.chunks.length === 1 && chunkSubstitutionsCnt === 1) {
		this.throwParserErrorIfNeeded(this.data.chunks[0] !== null, util.format('Parser error ! There is only 1 chunk to substitute, but his cell is not null for [%s] expression', this.data.str));
		return new NexlExpressionEvaluator(this.session, j79.getObjectValues(this.data.chunkSubstitutions)[0]).eval();
	}

	return this.evalAndSubstChunksInner();
};

function EvalAndSubstChunks(session, data) {
	this.session = session;
	this.data = data;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NexlExpressionEvaluator
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

NexlExpressionEvaluator.prototype.resolveSubExpressions = function () {
	if (nep.hasSubExpression(this.result)) {
		this.result = new NexlEngine(this.session).processItem(this.result);
	}
};


NexlExpressionEvaluator.prototype.forwardUpAmdPush = function (key, item) {
	if (!isObjectFunctionOrArray(item)) {
		throw util.format('Cannot resolve a [%s] property from non-object item. Item type is %s, item value is [%s]. Expression is [%s]. chunkNr is [%s]', key, j79.getType(item), JSON.stringify(item), this.nexlExpressionMD.str, this.chunkNr + 1);
	}

	item = item[key];
	this.newResult.push(item);
};

NexlExpressionEvaluator.prototype.resolveObject = function (key, currentResultItem, currentResultItemIndex) {
	var currentExternalArg = this.externalArgsPointer[currentResultItemIndex];
	var newResultLastItemIndex = this.newResult.length;

	// if key is empty, remaining current value
	if (key === '') {
		this.newResult.push(currentResultItem);
		this.newExternalArgsPointer[newResultLastItemIndex] = currentExternalArg;
		return;
	}

	// is current item in external arguments undefined ?
	if (currentExternalArg === undefined) {
		this.forwardUpAmdPush(key, currentResultItem);
		this.newExternalArgsPointer[newResultLastItemIndex] = undefined;
		return;
	}

	// forwarding up the external arg
	currentExternalArg = currentExternalArg[key];

	if (currentExternalArg === undefined) {
		this.forwardUpAmdPush(key, currentResultItem);
		this.newExternalArgsPointer[newResultLastItemIndex] = undefined;
		return;
	}

	// is it object ? ( array and function are also kind of objects )
	if (isObjectFunctionOrArray(currentExternalArg)) {
		this.forwardUpAmdPush(key, currentResultItem);
		this.newExternalArgsPointer[newResultLastItemIndex] = currentExternalArg;
		return;
	}

	// ok, it's a primitive. overriding
	this.newResult.push(currentExternalArg);
	this.newExternalArgsPointer[newResultLastItemIndex] = undefined;
};

NexlExpressionEvaluator.prototype.evalObjectActionInner = function (assembledChunks) {
	this.newResult = [];
	this.newExternalArgsPointer = [];
	var keys = j79.wrapWithArrayIfNeeded(assembledChunks);
	var isArrayFlag = j79.isArray(this.result);
	var currentResult = j79.wrapWithArrayIfNeeded(this.result);

	// iterating over keys
	for (var i in keys) {
		var key = keys[i];

		// key must be only a primitive. checking
		if (isObjectFunctionOrArray(key)) {
			throw util.format('The subexpression of [%s] expression cannot be evaluated as [%s] at the [%s] chunk', this.nexlExpressionMD.str, j79.getType(key), this.chunkNr + 1);
		}

		// iterating over current result items
		for (var j in currentResult) {
			this.resolveObject(key, currentResult[j], j);
		}
	}

	// unwrap array if needed
	if (this.newResult.length === 1 && !isArrayFlag) {
		this.newResult = this.newResult[0];
	}

	this.externalArgsPointer = this.newExternalArgsPointer;
	this.result = this.newResult;
};

NexlExpressionEvaluator.prototype.validate = function (assembledChunks) {
	// null check
	if (!j79.isValSet(assembledChunks)) {
		throw util.format('Cannot resolve a [%s] property from object in [%s] expression at the [%s] chunk', assembledChunks, this.nexlExpressionMD.str, this.chunkNr + 1);
	}

	// the type of assembledChunks mustn't be an object or function
	if (isObjectOrFunction(assembledChunks)) {
		throw util.format('The subexpression of [%s] expression cannot be evaluated as [%s] at the [%s] chunk', this.nexlExpressionMD.str, j79.getType(assembledChunks), this.chunkNr + 1);
	}
};

NexlExpressionEvaluator.prototype.evalObjectAction = function () {
	var data = {};
	data.chunks = this.action.chunks;
	data.chunkSubstitutions = this.action.chunkSubstitutions;

	// assembledChunks is string
	var assembledChunks = new EvalAndSubstChunks(this.session, data).evalAndSubstChunks();

	this.validate(assembledChunks);

	// resolving value from last this.result
	this.evalObjectActionInner(assembledChunks);
};

NexlExpressionEvaluator.prototype.evalFunction = function (func, params) {
	if (!j79.isFunction(func)) {
		throw util.format('The current item of a %s type and cannot be evaluated as function. Expression is [%s], chunkNr is [%s]', j79.getType(func), this.nexlExpressionMD.str, this.chunkNr + 1);
	}

	return func.apply(this.session.context, params);
};

NexlExpressionEvaluator.prototype.evalFunctionAction = function () {
	// assembling function params ( each param is nexl a expression. evaluating... )
	var params = [];
	for (var index in this.action.funcParams) {
		var funcParamMD = this.action.funcParams[index];
		var funcParam = new NexlExpressionEvaluator(this.session, funcParamMD).eval();
		params.push(funcParam);
	}

	// is single element ? ( little optimization )
	if (!j79.isArray(this.result)) {
		this.result = this.evalFunction(this.result, params);
		return;
	}

	// ok, it's an array. iterating over
	for (var index in this.result) {
		var item = this.result[index];
		this.result[index] = this.evalFunction(item, params);
	}
};

NexlExpressionEvaluator.prototype.evalItemIfNeeed = function (item) {
	// not a nexl variable ? return as is ( it must be a primitive number )
	if (!j79.isObject(item)) {
		return item;
	}

	var result = new NexlExpressionEvaluator(this.session, item).eval();
	if (!j79.isNumber(result)) {
		throw util.format('The [%s] nexl expression used in array index cannot be evaluated as %s. It must be a primitive number. Expressions is [%s], chunkNr is [%s]', item.str, j79.getType(item), this.nexlExpressionMD.str, this.chunkNr + 1);
	}

	var resultAsStr = result + '';
	if (!resultAsStr.match(/^[0-9]+$/)) {
		throw util.format('The [%s] nexl expression must be evaluated as primitive integer instead of [%s]. Expressions is [%s], chunkNr is [%s]', item.str, result, this.nexlExpressionMD.str, this.chunkNr + 1);
	}

	return result;
};

NexlExpressionEvaluator.prototype.resolveArrayRange = function (item) {
	var min = this.evalItemIfNeeed(item['min']);
	var max = this.evalItemIfNeeed(item['max']);

	// is max lower than min ?
	if (max < min) {
		throw util.format('Wrong array indexes : ( max = [%s] ) < ( min = [%s] ). Expressions is [%s], chunkNr is [%s]', max, min, this.nexlExpressionMD.str, this.chunkNr + 1);
	}

	// validating range
	if (min < 0 || max >= this.result.length) {
		throw util.format('Array index out of bound. Array length is [%s]. You are trying to access a (%s..%s) range. Expressions is [%s], chunkNr is [%s]', this.result.length, min, max, this.nexlExpressionMD.str, this.chunkNr + 1);

	}

	return {
		min: min,
		max: max
	};
};

NexlExpressionEvaluator.prototype.assignResult4ArrayIndexes = function (newResult) {
	if (newResult.length === 1) {
		this.result = newResult[0];
	} else {
		this.result = newResult;
	}
};

NexlExpressionEvaluator.prototype.evalArrayIndexesAction4Array = function () {
	var newResult = [];

	// iterating over arrayIndexes
	for (var index in this.action.arrayIndexes) {
		var item = this.action.arrayIndexes[index];
		var range = this.resolveArrayRange(item);

		for (var i = range.min; i <= range.max; i++) {
			var item = this.result[i];
			newResult.push(item);
		}
	}

	this.assignResult4ArrayIndexes(newResult);
};

NexlExpressionEvaluator.prototype.evalArrayIndexesAction4String = function () {
	var newResult = [];

	// iterating over arrayIndexes
	for (var index in this.action.arrayIndexes) {
		var item = this.action.arrayIndexes[index];
		var range = this.resolveArrayRange(item);

		var subStr = this.result.substring(range.min, range.max);
		newResult.push(subStr);
	}


	this.assignResult4ArrayIndexes(newResult);
};


NexlExpressionEvaluator.prototype.evalArrayIndexesAction = function () {
	if (j79.isArray(this.result)) {
		this.evalArrayIndexesAction4Array();
		return;
	}

	if (j79.isString(this.result)) {
		this.evalArrayIndexesAction4String();
		return;
	}

	throw util.format('Array indexes are not applicable item of [%s] type. Expressions is [%s], chunkNr is [%s]', j79.getType(this.result), this.nexlExpressionMD.str, this.chunkNr + 1);
};

NexlExpressionEvaluator.prototype.evalAction = function () {
	// is object action ? ( object actions have a chunks and chunkSubstitutions properties )
	if (j79.isArray(this.action.chunks) && j79.isObject(this.action.chunkSubstitutions)) {
		this.evalObjectAction();
		return;
	}

	// external args are actual only for object actions. invalidating
	this.externalArgsPointer = [];

	// is func action ?
	if (j79.isArray(this.action.funcParams)) {
		this.evalFunctionAction();
		return;
	}

	// is array index action ?
	if (j79.isArray(this.action.arrayIndexes)) {
		this.evalArrayIndexesAction();
		return;
	}

	throw 'nexl expression wasn\'t parsed properly, got unknown action. Please open me a bug'
};

NexlExpressionEvaluator.prototype.isValSet = function () {
	// is value not set ?
	if (!j79.isValSet(this.result)) {
		return false;
	}

	// if is not an array, the value is set ( can be a primitive, object or function )
	if (!j79.isArray(this.result)) {
		return true;
	}

	// iterating over array elements and checking every element
	for (var index in this.result) {
		var item = this.result[index];
		// is value not set ?
		if (!j79.isValSet(item)) {
			return false;
		}
	}

	return true;
};

// continuing cast
NexlExpressionEvaluator.prototype.castInner = function (value, currentType, requiredTypeJs) {
	// NUM -> BOOL
	if (currentType === nep.JS_PRIMITIVE_TYPES.NUM && requiredTypeJs === nep.JS_PRIMITIVE_TYPES.BOOL) {
		return value !== 0;
	}

	// NUM -> STR
	if (currentType === nep.JS_PRIMITIVE_TYPES.NUM && requiredTypeJs === nep.JS_PRIMITIVE_TYPES.STR) {
		return value + '';
	}

	// BOOL -> NUM
	if (currentType === nep.JS_PRIMITIVE_TYPES.BOOL && requiredTypeJs === nep.JS_PRIMITIVE_TYPES.NUM) {
		return value ? 1 : 0;
	}

	// BOOL -> STR
	if (currentType === nep.JS_PRIMITIVE_TYPES.BOOL && requiredTypeJs === nep.JS_PRIMITIVE_TYPES.STR) {
		return value + '';
	}

	// STR -> NUM
	if (currentType === nep.JS_PRIMITIVE_TYPES.STR && requiredTypeJs === nep.JS_PRIMITIVE_TYPES.NUM) {
		var result = parseFloat(value);
		if (isNaN(result)) {
			throw util.format('Cannot cast a [%s] value to [%s] type', value, nep.JS_PRIMITIVE_TYPES.NUM);
		}
		return result;
	}

	// STR -> BOOL
	if (currentType === nep.JS_PRIMITIVE_TYPES.STR && requiredTypeJs === nep.JS_PRIMITIVE_TYPES.BOOL) {
		if (value === 'false') {
			return false;
		}
		if (value === 'true') {
			return true;
		}

		throw util.format('Cannot cast a [%s] value to %s type', value, nep.JS_PRIMITIVE_TYPES.BOOL);
	}

	throw util.format('Unknown types permutation in casting. currentType is %s, requiredType type is %s', currentType, requiredTypeJs);
};

// example : value = 101; nexlType = 'bool';
NexlExpressionEvaluator.prototype.cast = function (value, nexlType) {
	// if type is not specified, return value as is
	if (!j79.isValSet(nexlType)) {
		return value;
	}

	// resolving JavaScript type
	var requiredTypeJs = nep.NEXL_TYPES[nexlType];

	// validating
	if (!j79.isValSet(requiredTypeJs)) {
		throw util.format('Unknown [%s] type', nexlType);
	}

	// resolving type for value
	var currentType = j79.getType(value);

	// is currentType not a part of JS_PRIMITIVE_TYPES ?
	if (nep.JS_PRIMITIVE_TYPES_VALUES.indexOf(currentType) < 0) {
		throw util.format('The %s type cannot be casted to [%s]', currentType, nexlType);
	}

	// if both types are same, return value as is
	if (currentType === requiredTypeJs) {
		return value;
	}

	// if one of currentType|requiredJsType is null|undefined, throw exception ( it's impossible to convert to/from null|undefined )
	if (currentType === nep.JS_PRIMITIVE_TYPES.NULL || currentType === nep.JS_PRIMITIVE_TYPES.UNDEFINED || requiredTypeJs === nep.JS_PRIMITIVE_TYPES.NULL || requiredTypeJs === nep.JS_PRIMITIVE_TYPES.UNDEFINED) {
		throw util.format('Cannot convert a %s to %s', currentType, requiredTypeJs);
	}

	return this.castInner(value, currentType, requiredTypeJs);
};

NexlExpressionEvaluator.prototype.resolveModifierValue = function (modifier) {
	var data = {};
	data.chunks = modifier.chunks;
	data.chunkSubstitutions = modifier.chunkSubstitutions;

	return new EvalAndSubstChunks(this.session, data).evalAndSubstChunks();
};

NexlExpressionEvaluator.prototype.castDefaultValue = function (modifierMd, modifierValue, type) {
	try {
		return this.cast(modifierValue, type);
	} catch (e) {
		throw util.format('Casting failed for [%s] expression. Reason : %s', modifierMd.str, e);
	}
};

NexlExpressionEvaluator.prototype.setDefaultValue = function (value) {
	if (!j79.isArray(this.result)) {
		this.result = value;
		return;
	}

	// iterating over array element and updating empty values
	for (var index in this.result) {
		var item = this.result[index];
		if (!j79.isValSet(item)) {
			this.result[index] = value;
		}
	}
};

NexlExpressionEvaluator.prototype.applyDefaultValueModifier = function () {
	// is value set for this.result ?
	if (this.isValSet(this.result)) {
		// don't need to apply default value modifier
		return;
	}

	// resolving modifier stuff by his id
	var defValueModifiers = this.nexlExpressionMD.modifiers[nep.MODIFIERS.DEF_VALUE];

	// is default value modifier not present ?
	if (!j79.isValSet(defValueModifiers)) {
		return;
	}

	// iterating over values of default value modifier
	for (var index in defValueModifiers) {
		var modifier = defValueModifiers[index];

		var modifierMd = modifier.modifierMD;
		var type = modifier.type;

		var modifierValue = this.resolveModifierValue(modifierMd);
		modifierValue = this.castDefaultValue(modifierMd, modifierValue, type);

		if (j79.isValSet(modifierValue)) {
			this.setDefaultValue(modifierValue);
			return;
		}
	}
};

NexlExpressionEvaluator.prototype.applyModifiers = function () {
	var result = this.result;

	// applying OMIT_WHOLE_EXPRESSION modifier
	// result = this.applyOmitModifier(result, varStuff);

	// applying object reverse resolution modifier
	// result = this.applyObjectReverseResolutionModifier(result, varStuff);

	// apply treat as modifier
	// result = this.applyTreatAsModifier(result, varStuff);

	// applying concat array elements modifier
	// result = this.applyConcatArrayElementsModifier(result, varStuff);

	// applying default value modifier
	result = this.applyDefaultValueModifier();

	return result;
};

NexlExpressionEvaluator.prototype.eval = function () {
	this.result = this.session.context;
	this.externalArgsPointer = [this.session.externalArgs];

	// iterating over actions
	for (this.chunkNr = 0; this.chunkNr < this.nexlExpressionMD.actions.length; this.chunkNr++) {
		// current action
		this.action = this.nexlExpressionMD.actions[this.chunkNr];

		// evaluating current action
		this.evalAction();

		// result may contain additional nexl expression with unlimited depth. resolving
		this.resolveSubExpressions();
	}

	this.applyModifiers();

	if (this.result === this.session.context) {
		return null;
	}

	return this.result;
};

function NexlExpressionEvaluator(session, nexlExpressionMD) {
	this.session = session;
	this.nexlExpressionMD = nexlExpressionMD;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NexlEngine
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


NexlEngine.prototype.processArrayItem = function (arr) {
	var result = [];

	for (var index in arr) {
		var arrItem = arr[index];
		var item = this.processItem(arrItem);

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
		var evaluatedKey = this.processItem(key);
		if (j79.isArray(evaluatedKey) || j79.isObject(evaluatedKey) || j79.isFunction(evaluatedKey)) {
			var type = j79.getType(evaluatedKey);
			throw util.format('Cannot assemble JavaScript object. The [%s] key is evaluated to a [%s] value which is not a primitive data type ( it has a [%s] data type )', key, JSON.stringify(evaluatedKey), type);
		}

		var value = obj[key];
		result[evaluatedKey] = this.processItem(value);
	}

	return result;
};

NexlEngine.prototype.processStringItem = function (str) {
	// parsing string
	var parsedStrMD = nep.parseStr(str);

	var data = {};
	data.chunks = parsedStrMD.chunks;
	data.chunkSubstitutions = parsedStrMD.chunkSubstitutions;
	data.str = str;

	// evaluating
	return new EvalAndSubstChunks(this.session, data).evalAndSubstChunks();
};

NexlEngine.prototype.processItem = function (item) {
	// iterates over each array element and processes every item
	if (j79.isArray(item)) {
		return this.processArrayItem(item);
	}

	// iterates over object keys and values and processes them
	if (j79.isObject(item)) {
		return this.processObjectItem(item);
	}

	// not supported !
	if (j79.isFunction(item)) {
		throw 'nexl engine doesn\'t know how to process javascript function';
	}

	// actually the only string elements are really being processed
	if (j79.isString(item)) {
		return this.processStringItem(item);
	}

	// all another primitives are not processable and being returned as is
	return item;
};

function NexlEngine(session) {
	this.session = session;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// exports
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.processItem = function (nexlSource, item, externalArgs) {
	var session = {};
	session.externalArgs = externalArgs;
	session.isOmit = false;

	// creating context
	session.context = nsu.createContext(nexlSource);

	// adding nexl object to the context
	session.context.nexl = {};

	// giving an access to arguments for functions in nexl-sources
	session.context.nexl.args = externalArgs;

	// supplying nexl engine for functions in nexl-sources
	session.context.nexl.processItem = function (nexlExpression) {
		return new NexlEngine(session).processItem(nexlExpression);
	};

	// supplying standard libraries
	session.context.Number = Number;
	session.context.Math = Math;
	session.context.Date = Date;
	session.context.isFinite = isFinite;
	session.context.isNaN = isNaN;
	session.context.parseFloat = parseFloat;
	session.context.parseInt = parseInt;

	return new NexlEngine(session).processItem(item);
};

// exporting 'settings-list'
module.exports['settings-list'] = Object.keys(DEFAULT_GLOBAL_SETTINGS);

// exporting resolveJsVariables
module.exports.resolveJsVariables = nsu.resolveJsVariables;
