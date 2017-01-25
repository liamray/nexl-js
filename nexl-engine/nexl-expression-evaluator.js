/**************************************************************************************
 nexl-engine

 Copyright (c) 2016-2017 Yevgeny Sergeyev
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


///////////////////////////////////////////////////////////////////


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
		var chunkValue = module.exports.evalNexlExpression(this.session, chunk2Substitute);

		this.validateChunkValue(chunkValue);

		// substituting chunkValue to result
		this.substitute(chunkValue, pos);
	}

	var finalResult = [];
	// iterating over additional array and joining chunks
	for (var i = 0; i < result.length; i++) {
		var item = result[i].join('');
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

	return this.assemble();
}

///////////////////////////////////////////////////////////////////


NexlExpressionEvaluator.prototype.hasSubExpression = function () {

};

NexlExpressionEvaluator.prototype.processItem = function () {

};

NexlExpressionEvaluator.prototype.resolveSubExpressions = function () {
	while (this.hasSubExpression(this.result)) {
		this.result = this.processItem();
	}
};

NexlExpressionEvaluator.prototype.evalObjectAction = function () {
	// assembledChunks is string
	var assembledChunks = new ChunksAssembler(this.session, this.action.chunks, this.action.chunkSubstitutions);

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
	// is object action ?
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

		// resolving action value ( actionValue is string or array of strings )
		var actionValue = this.evalAction();
	}

	this.applyModifiers();

	return result;
};

function NexlExpressionEvaluator(session, nexlExpressionMD) {
	this.session = session;
	this.nexlExpressionMD = nexlExpressionMD;

	return this.eval();
}


module.exports.evalNexlExpression = function (session, nexlExpressionMD) {
	return new NexlExpressionEvaluator(session, nexlExpressionMD);
};