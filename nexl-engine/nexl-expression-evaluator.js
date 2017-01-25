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


function NexlExpressionEvaluator(context, externalArgs, nexlExpressionMD) {
	this.context = context;
	this.externalArgs = externalArgs;
	this.nexlExpressionMD = nexlExpressionMD;
}


NexlExpressionEvaluator.prototype.evalObjectAction = function () {
	// iterating over chunkSubstitutions
	for (var pos in this.action.chunkSubstitutions) {
		// chi
		var chunk2Substitute = this.action.chunkSubstitutions[pos];
		var chunkValue = module.exports.evalNexlExpression(this.context, this.externalArgs, chunk2Substitute);

	}
};

NexlExpressionEvaluator.prototype.evalFuncAction = function () {

};

NexlExpressionEvaluator.prototype.evalArrayIndexesAction = function () {

};

NexlExpressionEvaluator.prototype.evalNexlAction = function () {
	// is object action ?
	if (j79.isArray(this.action.chunks) && j79.isObject(this.action.chunkSubstitutions)) {
		this.evalObjectAction();
	}

	// is func action ?
	if (j79.isArray(this.action.funcParams)) {
		this.evalFuncAction();
	}

	// is array index action ?
	if (j79.isArray(this.action.arrayIndexes)) {
		this.evalArrayIndexesAction();
	}

	throw 'nexl expression wasn\'t parsed properly, got unknown action. Please open me a bug'
};

NexlExpressionEvaluator.prototype.applyModifiersNew = function () {
};

NexlExpressionEvaluator.prototype.eval = function () {
	this.isArrayFlag = false;
	this.result = null;

	// iterating over actions
	for (var index = 0; index < nexlExpressionMD.actions.length; index++) {
		this.action = nexlExpressionMD.actions[index];
		this.evalNexlAction();
	}

	this.applyModifiersNew();

	return this.result;
};


module.exports.evalNexlExpression = function (context, externalArgs, nexlExpressionMD) {
	return new NexlExpressionEvaluator(context, externalArgs, nexlExpressionMD).eval();
};