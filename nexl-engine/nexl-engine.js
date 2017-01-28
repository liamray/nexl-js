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
	while (nep.hasSubExpression(this.result)) {
		this.result = new NexlEngine(this.session).processItem(this.result);
	}
};

NexlExpressionEvaluator.prototype.resolveNextObjectInner = function (assembledChunks) {
	// was it array in the beginning ?
	var isArrayFlag = j79.isArray(assembledChunks) || j79.isArray(this.result);
	var result = [];
	var keys = j79.wrapWithArrayIfNeeded(assembledChunks);
	var currentResult = j79.wrapWithArrayIfNeeded(this.result);

	for (var i in keys) {
		var keyItem = keys[i];

		// keyItem must be only a primitive. checking
		if (isObjectFunctionOrArray(keyItem)) {
			throw util.format('The subexpression of [%s] expression cannot be evaluated as [%s] at the [%s] chunk', this.nexlExpressionMD.str, j79.getType(keyItem), this.chunkNr + 1);
		}

		for (var j in currentResult) {
			var item = currentResult[j];
			if (!j79.isObject(item)) {
				throw util.format('Cannot resolve a [%s] property from non-object item. Item type is [%s], item value is [%s]. Expression is [%s]. chunkNr is [%s]', keyItem, j79.getType(item), JSON.stringify(item), this.nexlExpressionMD.str, this.chunkNr + 1);
			}
			if (keyItem !== '') {
				result.push(item[keyItem]);
			} else {
				result.push(item);
			}
		}
	}

	// unwrap array if needed
	if (result.length === 1 && !isArrayFlag) {
		result = result[0];
	}

	this.result = result;

	// result may contain additional nexl expression with unlimited depth. resolving
	this.resolveSubExpressions();
};

NexlExpressionEvaluator.prototype.resolveNextObject = function (assembledChunks) {
	// null check
	if (!j79.isValSet(assembledChunks)) {
		throw util.format('Cannot resolve a [%s] property from object in [%s] expression at the [%s] chunk', assembledChunks, this.nexlExpressionMD.str, this.chunkNr + 1);
	}

	// the type of assembledChunks mustn't be an object or function
	if (isObjectOrFunction(assembledChunks)) {
		throw util.format('The subexpression of [%s] expression cannot be evaluated as [%s] at the [%s] chunk', this.nexlExpressionMD.str, j79.getType(assembledChunks), this.chunkNr + 1);
	}

	this.resolveNextObjectInner(assembledChunks);
};

NexlExpressionEvaluator.prototype.evalObjectAction = function () {
	var data = {};
	data.chunks = this.action.chunks;
	data.chunkSubstitutions = this.action.chunkSubstitutions;

	// assembledChunks is string
	var assembledChunks = new EvalAndSubstChunks(this.session, data).evalAndSubstChunks();

	// resolving value from last this.result
	this.resolveNextObject(assembledChunks);
};

NexlExpressionEvaluator.prototype.evalFunctionAction = function () {

};

NexlExpressionEvaluator.prototype.evalArrayIndexesAction = function () {

};

NexlExpressionEvaluator.prototype.evalAction = function () {
	// is object action ? ( object actions have a chunks and chunkSubstitutions properties )
	if (j79.isArray(this.action.chunks) && j79.isObject(this.action.chunkSubstitutions)) {
		return this.evalObjectAction();
	}

	// external args are actual only for object actions. resetting
	this.externalArgsPointer = null;

	throw 'Will be implemented soon';

	// is func action ?
	if (j79.isArray(this.action.funcParams)) {
		return this.evalFunctionAction();
	}

	// is array index action ?
	if (j79.isArray(this.action.arrayIndexes)) {
		return this.evalArrayIndexesAction();
	}

	throw 'nexl expression wasn\'t parsed properly, got unknown action. Please open me a bug'
};

NexlExpressionEvaluator.prototype.applyModifiers = function () {
};

NexlExpressionEvaluator.prototype.eval = function () {
	this.result = this.session.context;
	this.externalArgsPointer = this.session.externalArgs;

	// iterating over actions
	for (this.chunkNr = 0; this.chunkNr < this.nexlExpressionMD.actions.length; this.chunkNr++) {
		// current action
		this.action = this.nexlExpressionMD.actions[this.chunkNr];

		// evaluating current action
		this.evalAction();
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

function NexlEngine(session, item) {
	this.session = session;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// exports
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.processItem = function (nexlSource, item, externalArgs) {
	var session = {};
	session.context = nsu.createContext(nexlSource);
	session.externalArgs = externalArgs;
	session.isOmit = false;

	return new NexlEngine(session, item).processItem(item);
};

// exporting 'settings-list'
module.exports['settings-list'] = Object.keys(DEFAULT_GLOBAL_SETTINGS);

// exporting resolveJsVariables
module.exports.resolveJsVariables = nsu.resolveJsVariables;
