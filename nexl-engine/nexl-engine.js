/**************************************************************************************
 nexl-engine

 Copyright (c) 2016-2017 Yevgeny Sergeyev
 License : Apache 2.0

 nexl expressions processor
 **************************************************************************************/

const util = require('util');
const deepMerge = require('deepmerge');
const j79 = require('j79-utils');
const nsu = require('./nexl-source-utils');
const nep = require('./nexl-expressions-parser');

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const NO_NEED_DEEP_RESOLUTION_ACTIONS = [nep.ACTIONS.DEF_VALUE, nep.ACTIONS.APPEND_TO_ARRAY, nep.ACTIONS.JOIN_ARRAY_ELEMENTS, nep.ACTIONS.MANDATORY_VALUE];

function isNeedDeepResolution(action) {
	return NO_NEED_DEEP_RESOLUTION_ACTIONS.indexOf(action.actionId) < 0;
}

function deepMergeInner(obj1, obj2) {
	if (obj2 === undefined) {
		return obj1;
	}

	if (!j79.isObject(obj2)) {
		return obj1;
	}

	return deepMerge(obj1, obj2);
}

function hasEvaluateAsUndefinedFlag(obj) {
	return ( ( obj || {} ).nexl || {} ).EVALUATE_AS_UNDEFINED === true;
}

function makeSession(nexlSource, externalArgs) {
	var session = {};

	// creating context
	session.context = nsu.createContext(nexlSource);

	// assigning external args
	session.externalArgs = externalArgs;
	if (session.externalArgs === undefined) {
		session.externalArgs = session.context.nexl.defaultArgs;
	}

	// args must be an object !
	if (!j79.isObject(session.externalArgs)) {
		session.externalArgs = {};
	}

	// giving an access to arguments for functions in nexl-sources
	session.context.nexl.args = externalArgs;

	return session;
}

function supplyStandardLibs(context) {
	context.Number = Number;
	context.Math = Math;
	context.Date = Date;
	context.isFinite = isFinite;
	context.isNaN = isNaN;
	context.parseFloat = parseFloat;
	context.parseInt = parseInt;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EvalAndSubstChunks
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

EvalAndSubstChunks.prototype.validate = function (chunk2Substitute, item) {
	if (!j79.isValSet(item)) {
		throw util.format('Cannot substitute [%s] value into [%s] for [%s] expression', item, chunk2Substitute.str, this.data.str);
	}

	if (!j79.isPrimitive(item)) {
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

	// storing EVALUATE_AS_UNDEFINED because NexlExpressionEvaluator can change it in session
	var isEvaluateAsUndefined = this.session.EVALUATE_AS_UNDEFINED;

	// iterating over chunkSubstitutions
	for (var pos in this.data.chunkSubstitutions) {
		// current chunk ( which is parsed nexl expression itself )
		var chunk2Substitute = this.data.chunkSubstitutions[pos];

		// evaluating this chunk
		// chunkValue must be a primitive or array of primitives. can't be object|function or array of objects|functions|arrays
		var chunkValue = new NexlExpressionEvaluator(this.session, chunk2Substitute).eval();

		// EVALUATE_AS_UNDEFINED action
		if (chunkValue === undefined && isEvaluateAsUndefined) {
			return undefined;
		}

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

NexlExpressionEvaluator.prototype.retrieveEvaluateAsUndefinedAction = function () {
	// iterating over actions
	for (var index in this.nexlExpressionMD.actions) {
		var action = this.nexlExpressionMD.actions[index];
		if (action.actionId === nep.ACTIONS.EVALUATE_AS_UNDEFINED) {
			this.isEvaluateAsUndefined = true;
			return;
		}
	}

	this.isEvaluateAsUndefined = false;
};

NexlExpressionEvaluator.prototype.expandObjectKeys = function () {
	// not relevant for standard libraries
	if (this.result === Math || this.result === Number || this.result === Date) {
		return;
	}

	var newResult = {};
	var nexlEngine = new NexlEngine(this.session, this.isEvaluateAsUndefined);

	for (var key in this.result) {
		if (!nep.hasSubExpression(key)) {
			newResult[key] = this.result[key];
			continue;
		}

		// nexilized key
		var newKey = nexlEngine.processItem(key);

		// key must be a primitive. checking...
		if (!j79.isPrimitive(newKey)) {
			throw util.format('Cannot assemble JavaScript object. The [%s] key is evaluated to a non-primitive data type %s', key, j79.getType(newKey));
		}

		newResult[newKey] = this.result[key];
	}

	this.result = newResult;
};

NexlExpressionEvaluator.prototype.resolveSubExpressions = function () {
	// it's not relevant for few actions
	if (!isNeedDeepResolution(this.action)) {
		return;
	}

	if (this.result === this.session.context) {
		return;
	}

	if (j79.isString(this.result) && nep.hasSubExpression(this.result)) {
		this.result = new NexlEngine(this.session, this.isEvaluateAsUndefined).processItem(this.result);
	}

	// evaluating object keys if they have nexl expressions
	if (j79.isObject(this.result)) {
		this.expandObjectKeys();
	}

	// array
	if (j79.isArray(this.result)) {
		this.result = new NexlEngine(this.session, this.isEvaluateAsUndefined).processItem(this.result);
	}
};


NexlExpressionEvaluator.prototype.forwardUpAndPush = function (key) {
	if (j79.isObject(this.result)) {
		this.newResult.push(this.result[key]);
	} else {
		this.newResult.push(undefined);
	}
};

NexlExpressionEvaluator.prototype.resolveObject = function (key) {
	// skipping undefined key
	if (key === undefined) {
		this.newResult.push(this.result);
		return;
	}

	// not a primitive ? make result undefined
	if (!j79.isPrimitive(key)) {
		this.newResult.push(undefined);
		this.externalArgsPointer = undefined;
		return;
	}

	// is current item in external arguments undefined ?
	if (this.externalArgsPointer === undefined) {
		this.forwardUpAndPush(key);
		return;
	}

	// forwarding up the external arg
	if (j79.isObject(this.externalArgsPointer)) {
		this.externalArgsPointer = this.externalArgsPointer[key];
	} else {
		this.externalArgsPointer = undefined;
	}

	if (this.externalArgsPointer === undefined) {
		this.forwardUpAndPush(key);
		return;
	}

	// is externalArgsPointer still object ?
	if (j79.isObject(this.externalArgsPointer)) {
		this.forwardUpAndPush(key);
		return;
	}

	// validating. it cannot contain nexl expressions
	if (j79.isString(this.externalArgsPointer) && nep.hasSubExpression(this.externalArgsPointer)) {
		throw util.format('External argument [%s] cannot contain nexl expression. It can be only a primitive', this.externalArgsPointer);
	}

	// functions and arrays are not acceptable for external args
	if (j79.isFunction(this.externalArgsPointer) || j79.isArray(this.externalArgsPointer)) {
		this.forwardUpAndPush(key);
		this.externalArgsPointer = undefined;
		return;
	}

	// it's ok, overriding
	this.newResult.push(this.externalArgsPointer);
	// resetting externalArgsPointer
	this.externalArgsPointer = undefined;
};

NexlExpressionEvaluator.prototype.applyPropertyResolutionActionInner = function () {
	var keys = j79.wrapWithArrayIfNeeded(this.assembledChunks);
	this.newResult = [];

	// iterating over keys
	for (var i in keys) {
		var key = keys[i];

		// resolving
		this.resolveObject(key);
	}

	this.result = j79.unwrapFromArrayIfPossible(this.newResult);
};

NexlExpressionEvaluator.prototype.applyPropertyResolutionAction = function () {
	var data = {};
	data.chunks = this.action.actionValue.chunks;
	data.chunkSubstitutions = this.action.actionValue.chunkSubstitutions;

	// assembledChunks is string
	this.assembledChunks = new EvalAndSubstChunks(this.session, data).evalAndSubstChunks();

	// skipping object resolution for undefined key
	if (this.assembledChunks === undefined) {
		return;
	}

	// accumulation actionsAsString
	if (j79.isArray(this.assembledChunks)) {
		this.actionsAsString.push('[]');
	}
	if (j79.isPrimitive(this.assembledChunks)) {
		this.actionsAsString.push(this.assembledChunks);
	}

	// resolving value from last this.result
	this.applyPropertyResolutionActionInner();
};

NexlExpressionEvaluator.prototype.evalFunctionAction = function () {
	// assembling function params ( each param is nexl a expression. evaluating... )
	var params = [];
	for (var index in this.action.actionValue) {
		var funcParamMD = this.action.actionValue[index];
		var funcParam = new NexlExpressionEvaluator(this.session, funcParamMD).eval();
		params.push(funcParam);
	}

	// not a function ? good bye
	if (!j79.isFunction(this.result)) {
		return;
	}

	this.result = this.result.apply(this.session.context, params);
};

NexlExpressionEvaluator.prototype.evalItemIfNeeded = function (item) {
	// not a nexl variable ? return as is ( it must be a primitive number )
	if (!j79.isObject(item)) {
		return item;
	}

	var result = new NexlExpressionEvaluator(this.session, item).eval();
	if (!j79.isNumber(result)) {
		throw util.format('The [%s] nexl expression used in array index cannot be evaluated as %s. It must be a primitive number. Expressions is [%s], chunkNr is [%s]', item.str, j79.getType(result), this.nexlExpressionMD.str, this.actionNr + 1);
	}

	var resultAsStr = result + '';
	if (!resultAsStr.match(/^[0-9]+$/)) {
		throw util.format('The [%s] nexl expression must be evaluated as primitive integer instead of [%s]. Expression is [%s], chunkNr is [%s]', item.str, result, this.nexlExpressionMD.str, this.actionNr + 1);
	}

	return result;
};

NexlExpressionEvaluator.prototype.resolveArrayRange = function (item) {
	var min = this.evalItemIfNeeded(item['min']);
	var max = this.evalItemIfNeeded(item['max']);

	return {
		min: min,
		max: max
	};
};

NexlExpressionEvaluator.prototype.assignResult4ArrayIndexes = function (newResult) {
	if (newResult.length < 1) {
		this.result = undefined;
		return;
	}

	this.result = j79.unwrapFromArrayIfPossible(newResult);
};

NexlExpressionEvaluator.prototype.evalArrayIndexesAction4Array = function () {
	var newResult = [];

	// iterating over arrayIndexes
	for (var index in this.action.actionValue) {
		var item = this.action.actionValue[index];
		var range = this.resolveArrayRange(item);

		for (var i = range.min; i <= range.max; i++) {
			var item = this.result[i];
			if (item === undefined) {
				continue;
			}
			newResult.push(item);
		}
	}

	this.assignResult4ArrayIndexes(newResult);
};

NexlExpressionEvaluator.prototype.evalArrayIndexesAction4String = function () {
	var newResult = [];

	// iterating over arrayIndexes
	for (var index in this.action.actionValue) {
		var item = this.action.actionValue[index];
		var range = this.resolveArrayRange(item);

		var subStr = this.result.substring(range.min, range.max);
		newResult.push(subStr);
	}


	this.assignResult4ArrayIndexes(newResult);
};


NexlExpressionEvaluator.prototype.applyArrayIndexesAction = function () {
	if (j79.isString(this.result)) {
		this.evalArrayIndexesAction4String();
		return;
	}

	if (j79.isArray(this.result)) {
		this.evalArrayIndexesAction4Array();
		return;
	}
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
			result = undefined;
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

		return undefined;
	}

	return value;
};

// example : value = 101; nexlType = 'bool';
NexlExpressionEvaluator.prototype.cast = function (value, type) {
	// if type is not specified
	if (type === undefined) {
		return value;
	}

	// resolving JavaScript type
	var jsType = nep.NEXL_TYPES[type];

	// validating ( should not happen )
	if (jsType === undefined) {
		throw util.format('Unknown [%s] type in [%s] expression. Use one of the following types : [%s]', type, this.nexlExpressionMD.str, Object.keys(nep.NEXL_TYPES));
	}

	var currentType = j79.getType(value);

	// if both types are same, return value as is
	if (currentType === jsType) {
		return value;
	}

	// cast to null
	if (jsType === nep.JS_PRIMITIVE_TYPES.NULL) {
		return null;
	}

	// cast to undefined
	if (jsType === nep.JS_PRIMITIVE_TYPES.UNDEFINED) {
		return undefined;
	}

	return this.castInner(value, currentType, jsType);
};

NexlExpressionEvaluator.prototype.resolveActionEvaluatedValue = function () {
	var data = {};
	data.chunks = this.action.actionValue.chunks;
	data.chunkSubstitutions = this.action.actionValue.chunkSubstitutions;

	return new EvalAndSubstChunks(this.session, data).evalAndSubstChunks();
};

NexlExpressionEvaluator.prototype.applyDefaultValueAction = function () {
	// is value not set for this.result ?
	if (this.result !== undefined) {
		// don't need to a apply default value action
		return;
	}

	this.result = this.resolveActionEvaluatedValue();
};

NexlExpressionEvaluator.prototype.applyCastAction = function () {
	this.result = this.cast(this.result, this.action.actionValue);
};

NexlExpressionEvaluator.prototype.wrapWithObjectIfNeeded = function (isObject) {
	if (isObject) {
		return;
	}

	var key = this.actionsAsString.length < 1 ? 'obj' : this.actionsAsString.join('.');

	var obj = {};
	obj[key] = this.result;
	this.result = obj;
};

NexlExpressionEvaluator.prototype.resolveObjectKeysIfNeeded = function (isObject) {
	return isObject ? Object.keys(this.result) : this.result;
};

NexlExpressionEvaluator.prototype.applyTransformationsAction = function () {
	var actionValue = this.action.actionValue;

	// applying ~A for non-objects
	if (actionValue === 'A') {
		this.result = j79.wrapWithArrayIfNeeded(this.result);
		return;
	}

	var isObject = j79.isObject(this.result);

	// applying ~O for non-objects
	if (actionValue === 'O') {
		this.wrapWithObjectIfNeeded(isObject);
		return;
	}

	// resolving keys for ~K
	if (actionValue === 'K') {
		this.result = this.resolveObjectKeysIfNeeded(isObject);
		this.result = j79.unwrapFromArrayIfPossible(this.result);
		return;
	}

	// resolving values for ~V
	if (actionValue === 'V') {
		this.result = j79.obj2ArrayIfNeeded(this.result);
		this.result = j79.unwrapFromArrayIfPossible(this.result);
		return;
	}
};
NexlExpressionEvaluator.prototype.isContainsValue = function (val, reversedKey) {
	// for array or object iterating over each value and querying
	if (j79.isArray(val) || j79.isObject(val)) {
		for (var index in val) {
			if (this.isContainsValue(val[index], reversedKey)) {
				return true;
			}
		}

		return false;
	}

	var reverseKeys = j79.wrapWithArrayIfNeeded(reversedKey);

	// reversedKey can be array
	for (var index in reverseKeys) {
		if (reverseKeys[index] === val) {
			return true;
		}
	}

	return false;
};

NexlExpressionEvaluator.prototype.applyObjectReverseResolutionAction = function () {
	// reverse resolution action is applying only for objects
	if (!j79.isObject(this.result)) {
		return;
	}

	// performing object deep resolution
	this.result = new NexlEngine(this.session, this.isEvaluateAsUndefined).processItem(this.result);

	// assembling action value
	var reverseKey = this.resolveActionEvaluatedValue();

	var newResult = [];

	// iterating over keys in this.result and checking
	for (var key in this.result) {
		var item = this.result[key];

		if (this.isContainsValue(item, reverseKey)) {
			newResult.push(key);
		}
	}

	if (newResult.length < 1) {
		this.result = undefined;
		return;
	}

	this.result = j79.unwrapFromArrayIfPossible(newResult);
};

NexlExpressionEvaluator.prototype.makeUniq = function () {
	var newResult = [];
	for (var index in this.result) {
		var item = this.result[index];
		if (newResult.indexOf(item) < 0) {
			newResult.push(item);
		}
	}

	this.result = newResult;
};

// #S, #s, #U, #C array operations action
NexlExpressionEvaluator.prototype.applyArrayOperationsAction = function () {
	// not an array ? bye bye
	if (!j79.isArray(this.result)) {
		return;
	}

	switch (this.action.actionValue) {
		// sort ascent
		case 'S': {
			this.result = this.result.sort();
			return;
		}

		// sort descent
		case 's': {
			this.result = this.result.sort();
			this.result = this.result.reverse();
			return;
		}

		// uniq
		case 'U': {
			this.makeUniq();
			return;
		}

		// length
		case 'LEN': {
			this.result = this.result.length;
			return;
		}

	}
};

NexlExpressionEvaluator.prototype.applyEliminateArrayElementsAction = function () {
	// not an array ? bye bye
	if (!j79.isArray(this.result)) {
		return;
	}

	// resolving action value
	var actionValue = this.resolveActionEvaluatedValue();

	// wrapping with array
	actionValue = j79.wrapWithArrayIfNeeded(actionValue);

	// iterating over actionValue and eliminating array elements
	for (var index in actionValue) {
		var item = actionValue[index];
		var removeCandidate = this.result.indexOf(item);
		if (removeCandidate < 0) {
			continue;
		}

		this.result.splice(removeCandidate, 1);
	}

	if (this.result.length < 1) {
		this.result = undefined;
	}
};

NexlExpressionEvaluator.prototype.applyAppendToArrayAction = function () {
	// not an array ? good bye ( can append only to array )
	if (!j79.isArray(this.result)) {
		return;
	}

	// resolving action value
	var actionValue = this.resolveActionEvaluatedValue();

	// if actionValue is array, merging 2 arrays. otherwise just pushing a value to existing
	if (j79.isArray(actionValue)) {
		this.result = this.result.concat(actionValue);
	} else {
		this.result.push(actionValue);
	}
};

NexlExpressionEvaluator.prototype.applyJoinArrayElementsAction = function () {
	// not an array ? bye bye
	if (!j79.isArray(this.result)) {
		return;
	}

	// resolving action value
	var actionValue = this.resolveActionEvaluatedValue();

	// validating action value
	if (!j79.isPrimitive(actionValue)) {
		throw util.format('Array elements cannot be joined with %s type in [%s] expression. Use primitive data types to join array elements', j79.getType(actionValue), this.nexlExpressionMD.str);
	}

	this.result = this.result.join(actionValue);
};

NexlExpressionEvaluator.prototype.applyStringOperationsAction = function () {
	// not a string ? good bye
	if (!j79.isString(this.result)) {
		return;
	}

	switch (this.action.actionValue) {
		// upper case
		case 'U': {
			this.result = this.result.toUpperCase();
			return;
		}

		// capitalize first letter
		case 'U1': {
			this.result = this.result.charAt(0).toUpperCase() + this.result.slice(1);
			return;
		}

		// lower case
		case 'L': {
			this.result = this.result.toLowerCase();
			return;
		}

		// length
		case 'LEN': {
			this.result = this.result.length;
			return;
		}

		// trim
		case 'T': {
			this.result = this.result.trim();
			return;
		}
	}
};

NexlExpressionEvaluator.prototype.applyMandatoryValueAction = function () {
	if (this.result === undefined) {
		throw util.format('The [%s] expression cannot be evaluated as undefined ( it has a mandatory value action ). Probably you have to provide it as external arg or check why it has evaluated as undefined', this.nexlExpressionMD.str);
	}
};

NexlExpressionEvaluator.prototype.applyAction = function () {
	switch (this.action.actionId) {
		// . property resolution action
		case nep.ACTIONS.PROPERTY_RESOLUTION: {
			this.applyPropertyResolutionAction();
			return;
		}

		// [] array indexes action
		case nep.ACTIONS.ARRAY_INDEX: {
			this.applyArrayIndexesAction();
			return;
		}

		// () function action
		case nep.ACTIONS.FUNCTION: {
			this.evalFunctionAction();
			return;
		}

		// @ default value action
		case nep.ACTIONS.DEF_VALUE: {
			this.applyDefaultValueAction();
			return;
		}

		// : cast action
		case nep.ACTIONS.CAST: {
			this.applyCastAction();
			return;
		}

		// ~K, ~V, ~O transformations action
		case nep.ACTIONS.TRANSFORMATIONS: {
			this.applyTransformationsAction();
			return;
		}

		// < object reverse resolution action
		case nep.ACTIONS.OBJECT_REVERSE_RESOLUTION: {
			this.applyObjectReverseResolutionAction();
			return;
		}

		// #S, #s, #U, #C array operations action
		case nep.ACTIONS.ARRAY_OPERATIONS: {
			this.applyArrayOperationsAction();
			return;
		}

		// - eliminate array elements action
		case nep.ACTIONS.ELIMINATE_ARRAY_ELEMENTS: {
			this.applyEliminateArrayElementsAction();
			return;
		}

		// + append to array action
		case nep.ACTIONS.APPEND_TO_ARRAY: {
			this.applyAppendToArrayAction();
			return;
		}

		// & join array elements action
		case nep.ACTIONS.JOIN_ARRAY_ELEMENTS: {
			this.applyJoinArrayElementsAction();
			return;
		}

		// ^U, ^L, ^LEN, ^T string operations action
		case nep.ACTIONS.STRING_OPERATIONS: {
			this.applyStringOperationsAction();
			return;
		}

		// eval as undefined action
		case nep.ACTIONS.EVALUATE_AS_UNDEFINED: {
			// this action is referenced at another place in code ( not here )
			return;
		}

		// mandatory value action
		case nep.ACTIONS.MANDATORY_VALUE: {
			this.applyMandatoryValueAction();
			return;
		}
	}

	throw util.format('The [%s] action in [%s] expression is reserved for future purposes. If you need to use this character in nexl expression, escape it', this.action.id, this.nexlExpressionMD.str);
};

NexlExpressionEvaluator.prototype.specialCareForPropertyResolutionAction = function () {
	if (this.action.actionId === nep.ACTIONS.PROPERTY_RESOLUTION) {
		return;
	}

	// external args actual only for property resolution actions
	this.externalArgsPointer = undefined;

	// first time this.result is equals to context, but it's not good for all other actions ( it's only good good for property resolution action )
	if (this.actionNr === 0) {
		this.result = undefined;
	}
};

NexlExpressionEvaluator.prototype.makeDeepResolutionIfNeeded = function () {
	if (this.action === undefined) {
		return;
	}

	// reprocessing final result, it can contain sub expressions
	if (isNeedDeepResolution(this.action)) {
		this.result = new NexlEngine(this.session, this.isEvaluateAsUndefined).processItem(this.result);
	}
};

NexlExpressionEvaluator.prototype.eval = function () {
	this.result = this.session.context;
	this.externalArgsPointer = this.session.externalArgs;
	this.retrieveEvaluateAsUndefinedAction();
	this.actionsAsString = [];

	// iterating over actions
	for (this.actionNr = 0; this.actionNr < this.nexlExpressionMD.actions.length; this.actionNr++) {
		// current action
		this.action = this.nexlExpressionMD.actions[this.actionNr];

		this.specialCareForPropertyResolutionAction();

		// evaluating current action
		this.applyAction();

		// result may contain additional nexl expression with unlimited depth. resolving
		this.resolveSubExpressions();
	}

	// empty expression like ${}
	if (this.result === this.session.context) {
		this.result = undefined;
	}

	this.makeDeepResolutionIfNeeded();

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

		// EVALUATE_AS_UNDEFINED action
		if (item === undefined && this.isEvaluateAsUndefined) {
			continue;
		}

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

		// EVALUATE_AS_UNDEFINED action
		if (evaluatedKey === undefined && this.isEvaluateAsUndefined) {
			continue;
		}

		// key must be a primitive. validating
		if (!j79.isPrimitive(evaluatedKey)) {
			throw util.format('Cannot assemble JavaScript object. The [%s] key is evaluated to a non-primitive data type %s', key, j79.getType(evaluatedKey));
		}

		var value = obj[key];
		value = this.processItem(value);

		// EVALUATE_AS_UNDEFINED action
		if (value === undefined && this.isEvaluateAsUndefined) {
			continue;
		}

		result[evaluatedKey] = value;
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
	this.session.EVALUATE_AS_UNDEFINED = this.isEvaluateAsUndefined;

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
		return item;
	}

	// actually the only string elements are really being processed
	if (j79.isString(item)) {
		return this.processStringItem(item);
	}

	// all another primitives are not processable and being returned as is
	return item;
};

function NexlEngine(session, isEvaluateAsUndefined) {
	this.session = session;
	this.isEvaluateAsUndefined = isEvaluateAsUndefined;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// exports
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.processItem = function (nexlSource, item, externalArgs) {
	var session = makeSession(nexlSource, externalArgs);

	// supplying nexl engine for functions in nexl-sources
	session.context.nexl.processItem = function (nexlExpression, externalArgs4Function) {
		// merging existing external args
		session.externalArgs = deepMergeInner(session.externalArgs, externalArgs4Function);
		var isEvaluateAsUndefined = hasEvaluateAsUndefinedFlag(session.externalArgs);

		// running nexl engine
		var result = new NexlEngine(session, isEvaluateAsUndefined).processItem(nexlExpression);

		// restoring external args
		session.externalArgs = externalArgs;
		return result;
	};

	// supplying standard libraries
	supplyStandardLibs(session.context);

	// should item be evaluated as undefined if it contains undefined variables ?
	var isEvaluateAsUndefined = hasEvaluateAsUndefinedFlag(externalArgs);

	// is item not specified, using a default nexl expression
	var item2Process = item === undefined ? session.context.nexl.defaultExpression : item;

	// running nexl engine
	return new NexlEngine(session, isEvaluateAsUndefined).processItem(item2Process);
};

// exporting resolveJsVariables
module.exports.resolveJsVariables = nsu.resolveJsVariables;
