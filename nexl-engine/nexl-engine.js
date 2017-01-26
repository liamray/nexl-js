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
// ChunksAssembler
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
ChunksAssembler.prototype.substitute = function (chunkValue, pos) {
	var newResult = [];
	var value = j79.wrapWithArrayIfNeeded(chunkValue);

	for (var i = 0; i < value.length; i++) {
		var item = value[i];
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

ChunksAssembler.prototype.validateChunkValue = function (chunkValue) {
	// all chunks will be joined to one string. objects and function has the [Object object] and [Object function] string representation. It's unacceptable
	if (j79.isObject(chunkValue) || j79.isFunction(chunkValue)) {
		// todo : !!!
		throw util.format('todo : make good error message');
	}
};


ChunksAssembler.prototype.assemble = function () {
	// cloning chunks array and wrapping with additional array
	this.result = [this.chunks.slice(0)];

	// tells if additional array should remain
	var isArrayFlag = false;

	// iterating over chunkSubstitutions
	for (var pos in this.chunkSubstitutions) {
		// current chunk ( which is parsed nexl expression itself )
		var chunk2Substitute = this.chunkSubstitutions[pos];

		// evaluating this chunk
		var chunkValue = new NexlExpressionEvaluator(this.session, chunk2Substitute).eval();

		this.validateChunkValue(chunkValue);

		// substituting chunkValue to result
		this.substitute(chunkValue, pos);
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


	return finalResult;
};

function ChunksAssembler(session, chunks, chunkSubstitutions) {
	this.session = session;
	this.chunks = chunks;
	this.chunkSubstitutions = chunkSubstitutions;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NexlExpressionEvaluator
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

NexlExpressionEvaluator.prototype.resolveSubExpressions = function () {
	while (nep.hasSubExpression(this.result)) {
		this.result = new NexlItemsProcessor(this.session).processItem(this.result);
	}
};

NexlExpressionEvaluator.prototype.evalObjectAction = function () {
	// assembledChunks is string
	var assembledChunks = new ChunksAssembler(this.session, this.action.chunks, this.action.chunkSubstitutions).assemble();

	// resolving value from last result
	this.result = this.result[assembledChunks];

	// result may contain additional nexl expression with unlimited depth. resolving
	this.resolveSubExpressions();
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

	// iterating over actions
	for (var index = 0; index < this.nexlExpressionMD.actions.length; index++) {
		// current action
		this.action = this.nexlExpressionMD.actions[index];

		// evaluating current action
		this.evalAction();
	}

	this.applyModifiers();

	return this.result;
};

function NexlExpressionEvaluator(session, nexlExpressionMD) {
	this.session = session;
	this.nexlExpressionMD = nexlExpressionMD;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NexlItemsProcessor
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


NexlItemsProcessor.prototype.processArrayItem = function (arr) {
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

NexlItemsProcessor.prototype.processObjectItem = function (obj) {
	var result = {};

	// iterating over over keys:values and evaluating
	for (var key in obj) {
		var evaluatedKey = this.processItem(key);
		if (j79.isArray(evaluatedKey) || j79.isObject(evaluatedKey) || j79.isFunction(evaluatedKey)) {
			var type = j79.getType(evaluatedKey);
			throw util.format('Can\'t assemble JavaScript object. The [%s] key is evaluated to a [%s] value which is not a primitive data type ( it has a [%s] data type )', key, JSON.stringify(evaluatedKey), type);
		}

		var value = obj[key];
		result[evaluatedKey] = this.processItem(value);
	}

	return result;
};

NexlItemsProcessor.prototype.processStringItem = function (str) {
	// parsing string
	var parsedStrMD = nep.parseStr(str);

	// evaluating
	return new ChunksAssembler(this.session, parsedStrMD.chunks, parsedStrMD.chunkSubstitutions).assemble();
};

NexlItemsProcessor.prototype.processItem = function (item) {
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

function NexlItemsProcessor(session, item) {
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

	return new NexlItemsProcessor(session, item).processItem(item);
};

// exporting 'settings-list'
module.exports['settings-list'] = Object.keys(DEFAULT_GLOBAL_SETTINGS);

// exporting resolveJsVariables
module.exports.resolveJsVariables = nsu.resolveJsVariables;
