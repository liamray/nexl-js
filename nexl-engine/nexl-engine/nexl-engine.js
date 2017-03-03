/**************************************************************************************
 nexl-engine

 Copyright (c) 2016-2017 Yevgeny Sergeyev
 License : Apache 2.0

 nexl expressions processor
 **************************************************************************************/

const util = require('util');
const j79 = require('j79-utils');
const nexlSourceUtils = require('./nexl-source-utils');
const nexlExpressionsParser = require('./nexl-expressions-parser');
const nexlEngineUtils = require('./nexl-engine-utils');
const js2xmlparser = require("js2xmlparser");
const YAML = require('yamljs');

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

	// is one of the chunks is array
	var isArrayFlag = false;

	// iterating over chunkSubstitutions
	for (var pos in this.data.chunkSubstitutions) {
		// current chunk ( which is parsed nexl expression itself )
		var chunk2Substitute = this.data.chunkSubstitutions[pos];

		// evaluating this chunk
		// chunkValue must be a primitive or array of primitives. can't be object|function or array of objects|functions|arrays
		var chunkValue = new NexlExpressionEvaluator(this.context, chunk2Substitute).eval();

		// !U UNDEFINED_VALUE_OPERATIONS action
		if (chunkValue === undefined && this.isEvaluateAsUndefined) {
			return undefined;
		}

		if (!isArrayFlag && j79.isArray(chunkValue)) {
			isArrayFlag = true;
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

	if (finalResult === this.context) {
		finalResult = undefined;
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
		return new NexlExpressionEvaluator(this.context, j79.getObjectValues(this.data.chunkSubstitutions)[0]).eval();
	}

	return this.evalAndSubstChunksInner();
};

function EvalAndSubstChunks(context, isEvaluateAsUndefined, data) {
	this.context = context;
	this.isEvaluateAsUndefined = isEvaluateAsUndefined;
	this.data = data;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NexlExpressionEvaluator
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

NexlExpressionEvaluator.prototype.retrieveEvaluateAsUndefinedAction = function () {
	// iterating over actions
	for (var index in this.nexlExpressionMD.actions) {
		var action = this.nexlExpressionMD.actions[index];
		if (action.actionId === nexlExpressionsParser.ACTIONS.UNDEFINED_VALUE_OPERATIONS && action.actionValue === nexlExpressionsParser.UNDEFINED_VALUE_OPERATIONS_OPTIONS.EVALUATE_AS_UNDEFINED) {
			this.isEvaluateAsUndefined = true;
			return;
		}
	}

	this.isEvaluateAsUndefined = false;
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
		return;
	}

	if (j79.isObject(this.result)) {
		this.newResult.push(this.result[key]);
	} else {
		this.newResult.push(undefined);
	}
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
	this.assembledChunks = new EvalAndSubstChunks(this.context, this.isEvaluateAsUndefined, data).evalAndSubstChunks();

	// skipping object resolution for undefined key
	if (this.assembledChunks === undefined) {
		return;
	}

	// accumulation actionsAsString ( actionsAsString is used for ~O action as object key )
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
		var funcParam = new NexlExpressionEvaluator(this.context, funcParamMD).eval();
		params.push(funcParam);
	}

	// not a function ? good bye
	if (!j79.isFunction(this.result)) {
		return;
	}

	this.result = this.result.apply(this.context, params);
};

NexlExpressionEvaluator.prototype.resolveRealArrayIndex = function (item) {
	var arrayIndex;
	if (j79.isObject(item)) {
		arrayIndex = new NexlExpressionEvaluator(this.context, item).eval();
	} else {
		arrayIndex = item;
	}

	// first item
	if (arrayIndex === nexlExpressionsParser.ARRAY_FIRST_ITEM) {
		return 0;
	}

	// last item
	if (arrayIndex === nexlExpressionsParser.ARRAY_LAST_ITEM) {
		return this.result.length - 1;
	}

	// validating ( must be an integer )
	if (!j79.isNumber(arrayIndex) || (arrayIndex + '').indexOf('.') >= 0) {
		throw util.format('The [%s] nexl expression used in array index cannot be evaluated as %s. It must be an integer number. Expressions is [%s], actionNr is [%s]', item.str, j79.getType(arrayIndex), this.nexlExpressionMD.str, this.actionNr + 1);
	}

	// for negative numbers recalculating them relating to the end
	return arrayIndex < 0 ? this.result.length - 1 + arrayIndex : arrayIndex;
};

NexlExpressionEvaluator.prototype.resolveArrayRange = function (item) {
	var min = this.resolveRealArrayIndex(item['min']);
	var max = this.resolveRealArrayIndex(item['max']);

	return {
		min: min,
		max: max
	};
};

NexlExpressionEvaluator.prototype.evalArrayIndexesAction4Array = function () {
	// skipping if there is no indexes
	if (this.action.actionValue.length < 1) {
		return;
	}

	var newResult = [];

	// iterating over arrayIndexes
	for (var index in this.action.actionValue) {
		var item = this.action.actionValue[index];
		var range = this.resolveArrayRange(item);

		for (var i = range.min; i <= Math.min(range.max, this.result.length - 1); i++) {
			var item = this.result[i];
			newResult.push(item);
		}
	}

	if (newResult.length === 1) {
		this.result = newResult[0];
		return;
	}

	if (newResult.length < 1) {
		this.result = undefined;
		return;
	}

	this.result = newResult;
};

NexlExpressionEvaluator.prototype.evalArrayIndexesAction4String = function () {
	// skipping if there is no indexes for substring
	if (this.action.actionValue.length < 1) {
		return;
	}

	var newResult = [];

	// iterating over arrayIndexes
	for (var index in this.action.actionValue) {
		var item = this.action.actionValue[index];
		var range = this.resolveArrayRange(item);

		var subStr = this.result.substring(range.min, range.max + 1);
		newResult.push(subStr);
	}


	this.result = j79.unwrapFromArrayIfPossible(newResult);
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

NexlExpressionEvaluator.prototype.resolveActionEvaluatedValue = function () {
	var data = {};
	data.chunks = this.action.actionValue.chunks;
	data.chunkSubstitutions = this.action.actionValue.chunkSubstitutions;

	return new EvalAndSubstChunks(this.context, this.isEvaluateAsUndefined, data).evalAndSubstChunks();
};

NexlExpressionEvaluator.prototype.applyDefaultValueAction = function () {
	// no need deep resolution for this action
	this.needDeepResolution = false;

	// is value not set for this.result ?
	if (this.result !== undefined) {
		// don't need to a apply default value action
		return;
	}

	this.result = this.resolveActionEvaluatedValue();
};

NexlExpressionEvaluator.prototype.applyCastAction = function () {
	this.result = nexlEngineUtils.cast(this.result, this.action.actionValue);
};

NexlExpressionEvaluator.prototype.convert2Object = function () {
	if (j79.isObject(this.result)) {
		return;
	}

	var key = this.actionsAsString.length < 1 ? 'obj' : this.actionsAsString.join('.');

	var obj = {};
	if (this.result !== undefined) {
		obj[key] = this.result;
	}
	this.result = obj;
};

NexlExpressionEvaluator.prototype.resolveObjectKeys = function () {
	if (!j79.isObject(this.result)) {
		return;
	}

	this.result = Object.keys(this.result);
	this.result = j79.unwrapFromArrayIfPossible(this.result);
};

NexlExpressionEvaluator.prototype.resolveObjectValues = function () {
	if (!j79.isObject(this.result)) {
		return;
	}

	this.result = j79.obj2ArrayIfNeeded(this.result);
	this.result = j79.unwrapFromArrayIfPossible(this.result);
};

NexlExpressionEvaluator.prototype.produceKeyValuesPairs = function () {
	// no need deep resolution for this action
	this.needDeepResolution = false;

	if (!j79.isObject(this.result)) {
		return;
	}

	// performing object deep resolution
	this.result = new NexlEngine(this.context, this.isEvaluateAsUndefined).processItem(this.result);

	var result = [];
	nexlEngineUtils.produceKeyValuesPairs(undefined, this.result, result);

	this.result = result.join('\n');
};

NexlExpressionEvaluator.prototype.produceXML = function () {
	// no need deep resolution for this action
	this.needDeepResolution = false;

	if (!j79.isObject(this.result)) {
		return;
	}

	// performing object deep resolution
	this.result = new NexlEngine(this.context, this.isEvaluateAsUndefined).processItem(this.result);

	var root = this.actionsAsString.length < 1 ? 'root' : this.actionsAsString.join('.');
	this.result = js2xmlparser.parse(root, this.result);
};

NexlExpressionEvaluator.prototype.produceYAML = function () {
	// no need deep resolution for this action
	this.needDeepResolution = false;

	if (!j79.isObject(this.result)) {
		return;
	}

	// performing object deep resolution
	this.result = new NexlEngine(this.context, this.isEvaluateAsUndefined).processItem(this.result);

	this.result = YAML.stringify(this.result);
};

NexlExpressionEvaluator.prototype.applyObjectOperationsAction = function () {
	var actionValue = this.action.actionValue;

	switch (actionValue) {
		case nexlExpressionsParser.OBJECT_OPERATIONS_OPTIONS.CONVERT_TO_OBJECT : {
			this.convert2Object();
			return;
		}

		case nexlExpressionsParser.OBJECT_OPERATIONS_OPTIONS.RESOLVE_KEYS : {
			this.resolveObjectKeys();
			return;
		}

		case nexlExpressionsParser.OBJECT_OPERATIONS_OPTIONS.RESOLVE_VALUES : {
			this.resolveObjectValues();
			return;
		}

		case nexlExpressionsParser.OBJECT_OPERATIONS_OPTIONS.PRODUCE_KEY_VALUE_PAIRS : {
			this.produceKeyValuesPairs();
			return;
		}

		case nexlExpressionsParser.OBJECT_OPERATIONS_OPTIONS.PRODUCE_XML : {
			this.produceXML();
			return;
		}

		case nexlExpressionsParser.OBJECT_OPERATIONS_OPTIONS.PRODUCE_YAML : {
			this.produceYAML();
			return;
		}
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
	this.result = new NexlEngine(this.context, this.isEvaluateAsUndefined).processItem(this.result);

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

	this.result = newResult;
};

NexlExpressionEvaluator.prototype.convert2Array = function () {
	if (j79.isArray(this.result)) {
		return;
	}

	this.result = this.result === undefined ? [] : [this.result];
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

NexlExpressionEvaluator.prototype.findDuplicatesAndRemove = function (item) {
	var cnt = 0;
	var index = 0;
	while (true) {
		index = this.result.indexOf(item, index);
		if (index < 0) {
			break;
		}
		this.result.splice(index, 1);
		cnt++;
	}

	return cnt > 1;
};

NexlExpressionEvaluator.prototype.makeDuplicates = function () {
	var newResult = [];
	while (this.result.length > 0) {
		var item = this.result[0];
		if (this.findDuplicatesAndRemove(item)) {
			newResult.push(item);
		}
	}

	this.result = newResult;
};

// #S, #s, #U, #D, #LEN, #F array operations action
NexlExpressionEvaluator.prototype.applyArrayOperationsAction = function () {
	// is convert to array ?
	if (this.action.actionValue === nexlExpressionsParser.ARRAY_OPERATIONS_OPTIONS.CONVERT_TO_ARRAY) {
		this.convert2Array();
		return;
	}

	// not an array ? bye bye
	if (!j79.isArray(this.result)) {
		return;
	}

	switch (this.action.actionValue) {
		// sort ascent
		case nexlExpressionsParser.ARRAY_OPERATIONS_OPTIONS.SORT_ASC: {
			this.result = this.result.sort();
			return;
		}

		// sort descent
		case nexlExpressionsParser.ARRAY_OPERATIONS_OPTIONS.SORT_DESC: {
			this.result = this.result.sort();
			this.result = this.result.reverse();
			return;
		}

		// uniq
		case nexlExpressionsParser.ARRAY_OPERATIONS_OPTIONS.UNIQUE: {
			this.makeUniq();
			return;
		}

		// duplicates
		case nexlExpressionsParser.ARRAY_OPERATIONS_OPTIONS.DUPLICATES: {
			this.makeDuplicates();
			return;
		}

		// length
		case nexlExpressionsParser.ARRAY_OPERATIONS_OPTIONS.LENGTH: {
			this.result = this.result.length;
			return;
		}

		// if array contains only one element, resolve it. otherwise make it undefined
		case nexlExpressionsParser.ARRAY_OPERATIONS_OPTIONS.GET_FIRST_OR_NOTHING: {
			this.result = this.result.length === 1 ? this.result[0] : undefined;
			return;
		}
	}
};

NexlExpressionEvaluator.prototype.applyEliminateArrayElements = function () {
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
};

NexlExpressionEvaluator.prototype.applyEliminateObjectProperties = function () {
	// resolving action value
	var actionValue = this.resolveActionEvaluatedValue();

	// wrapping with array
	actionValue = j79.wrapWithArrayIfNeeded(actionValue);

	// iterating over actionValue array
	for (var index in actionValue) {
		var item = actionValue[index];
		if (!j79.isValSet(item)) {
			continue;
		}

		if (j79.isPrimitive(item)) {
			delete this.result[item];
		}
	}
};

NexlExpressionEvaluator.prototype.applyEliminateAction = function () {
	if (j79.isArray(this.result)) {
		this.applyEliminateArrayElements();
		return;
	}

	if (j79.isObject(this.result)) {
		this.applyEliminateObjectProperties();
		return;
	}
};

NexlExpressionEvaluator.prototype.appendArrayElements = function () {
	// resolving action value
	var actionValue = this.resolveActionEvaluatedValue();

	// if actionValue is array, merging 2 arrays. otherwise just pushing a value to existing
	if (j79.isArray(actionValue)) {
		this.result = this.result.concat(actionValue);
	} else {
		this.result.push(actionValue);
	}
};

NexlExpressionEvaluator.prototype.mergeObjects = function () {
	// resolving action value
	var actionValue = this.resolveActionEvaluatedValue();

	if (!j79.isObject(actionValue)) {
		return;
	}

	// performing object deep resolution
	this.result = new NexlEngine(this.context, this.isEvaluateAsUndefined).processItem(this.result);

	this.result = nexlEngineUtils.deepMergeInner(this.result, actionValue);
};

NexlExpressionEvaluator.prototype.applyAppendMergeAction = function () {
	// no need deep resolution for this action
	this.needDeepResolution = false;

	if (j79.isArray(this.result)) {
		this.appendArrayElements();
		return;
	}

	if (j79.isObject(this.result)) {
		this.mergeObjects();
		return;
	}
};

NexlExpressionEvaluator.prototype.applyJoinArrayElementsAction = function () {
	// no need deep resolution for this action
	this.needDeepResolution = false;

	// not an array ? bye bye
	if (!j79.isArray(this.result)) {
		return;
	}

	// resolving action value
	var actionValue = this.resolveActionEvaluatedValue();

	// validating action value
	if (!j79.isPrimitive(actionValue)) {
		throw util.format('Array elements cannot be joined with %s type in [%s] expression. Use a primitive data types to join array elements', j79.getType(actionValue), this.nexlExpressionMD.str);
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
		case nexlExpressionsParser.STRING_OPERATIONS_OPTIONS.UPPERCASE: {
			this.result = this.result.toUpperCase();
			return;
		}

		// capitalize first letter
		case nexlExpressionsParser.STRING_OPERATIONS_OPTIONS.CAPITALIZE_FIRST_LETTER: {
			this.result = this.result.charAt(0).toUpperCase() + this.result.slice(1);
			return;
		}

		// lower case
		case nexlExpressionsParser.STRING_OPERATIONS_OPTIONS.LOWERCASE: {
			this.result = this.result.toLowerCase();
			return;
		}

		// length
		case nexlExpressionsParser.STRING_OPERATIONS_OPTIONS.LENGTH: {
			this.result = this.result.length;
			return;
		}

		// trim
		case nexlExpressionsParser.STRING_OPERATIONS_OPTIONS.TRIM: {
			this.result = this.result.trim();
			return;
		}
	}
};

NexlExpressionEvaluator.prototype.undefinedValueOperations = function () {
	// empty values
	if (this.action.actionValue !== nexlExpressionsParser.UNDEFINED_VALUE_OPERATIONS_OPTIONS.MAKE_EMPTY_ITEMS_UNDEFINED) {
		return;
	}

	// converting empty array to undefined
	if (j79.isArray(this.result)) {
		this.result = this.result.length < 1 ? undefined : this.result;
		return;
	}

	// converting empty array to undefined
	if (j79.isArray(this.result)) {
		this.result = this.result.length < 1 ? undefined : this.result;
		return;
	}

	// converting empty object to undefined
	if (j79.isObject(this.result)) {
		this.result = Object.keys(this.result).length < 1 ? undefined : this.result;
		return;
	}

	// converting empty string to undefined
	if (j79.isString(this.result)) {
		this.result = this.result.length < 1 ? undefined : this.result;
		return;
	}
};

NexlExpressionEvaluator.prototype.applyMandatoryValueAction = function () {
	// no need deep resolution for this action
	this.needDeepResolution = false;

	if (this.result !== undefined) {
		return;
	}

	var defaultErrorMessage = util.format('The [%s] expression cannot be evaluated as undefined ( it has a mandatory value action ). Probably you have to provide it as external arg or check why it has calculated as undefined', this.nexlExpressionMD.str);

	// does this action have a custom error message ?
	if (this.action.actionValue.chunks[0] === '') {
		// default error message
		throw defaultErrorMessage;
	}

	// resolving custom error message
	var customErrorMessage;
	try {
		customErrorMessage = this.resolveActionEvaluatedValue();
	} catch (e) {
		throw util.format('%s\nFailed to evaluate custom error message. Reason : %s', defaultErrorMessage, e);
	}

	throw customErrorMessage;
};

NexlExpressionEvaluator.prototype.applyAction = function () {
	switch (this.action.actionId) {
		// . property resolution action
		case nexlExpressionsParser.ACTIONS.PROPERTY_RESOLUTION: {
			this.applyPropertyResolutionAction();
			return;
		}

		// [] array indexes action
		case nexlExpressionsParser.ACTIONS.ARRAY_INDEX: {
			this.applyArrayIndexesAction();
			return;
		}

		// () function action
		case nexlExpressionsParser.ACTIONS.FUNCTION: {
			this.evalFunctionAction();
			return;
		}

		// @ default value action
		case nexlExpressionsParser.ACTIONS.DEF_VALUE: {
			this.applyDefaultValueAction();
			return;
		}

		// : cast action
		case nexlExpressionsParser.ACTIONS.CAST: {
			this.applyCastAction();
			return;
		}

		// ~K, ~V, ~O, ~X, ~P, ~Y, ~Z converters action
		case nexlExpressionsParser.ACTIONS.OBJECT_OPERATIONS: {
			this.applyObjectOperationsAction();
			return;
		}

		// < object reverse resolution action
		case nexlExpressionsParser.ACTIONS.OBJECT_REVERSE_RESOLUTION: {
			this.applyObjectReverseResolutionAction();
			return;
		}

		// #S, #s, #U, #D, #LEN, #A array operations action
		case nexlExpressionsParser.ACTIONS.ARRAY_OPERATIONS: {
			this.applyArrayOperationsAction();
			return;
		}

		// - eliminate array elements action
		case nexlExpressionsParser.ACTIONS.ELIMINATE: {
			this.applyEliminateAction();
			return;
		}

		// + append to array action
		case nexlExpressionsParser.ACTIONS.APPEND_MERGE: {
			this.applyAppendMergeAction();
			return;
		}

		// & join array elements action
		case nexlExpressionsParser.ACTIONS.JOIN_ARRAY_ELEMENTS: {
			this.applyJoinArrayElementsAction();
			return;
		}

		// ^U, ^L, ^LEN, ^T, ^Z string operations action
		case nexlExpressionsParser.ACTIONS.STRING_OPERATIONS: {
			this.applyStringOperationsAction();
			return;
		}

		// eval as undefined action
		case nexlExpressionsParser.ACTIONS.UNDEFINED_VALUE_OPERATIONS: {
			this.undefinedValueOperations();
			return;
		}

		// mandatory value action
		case nexlExpressionsParser.ACTIONS.MANDATORY_VALUE: {
			this.applyMandatoryValueAction();
			return;
		}
	}

	throw util.format('The [%s] action in [%s] expression is reserved for future purposes. If you need to use this character in nexl expression, escape it', this.action.actionId, this.nexlExpressionMD.str);
};

NexlExpressionEvaluator.prototype.specialCareForPropertyResolutionAction = function () {
	// first time this.result is equals to context, but it's not good for all other actions ( it's only good good for property resolution action )
	if (this.actionNr === 0 && this.action.actionId !== nexlExpressionsParser.ACTIONS.PROPERTY_RESOLUTION) {
		this.result = undefined;
	}
};


NexlExpressionEvaluator.prototype.expandObjectKeys = function () {
	// not relevant for standard libraries
	if (this.result === Math || this.result === Number || this.result === Date) {
		return;
	}

	var newResult = {};
	var nexlEngine = new NexlEngine(this.context, this.isEvaluateAsUndefined);

	for (var key in this.result) {
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
	if (!this.needDeepResolution) {
		return;
	}

	if (this.result === this.context) {
		return;
	}

	if (j79.isString(this.result)) {
		this.result = new NexlEngine(this.context, this.isEvaluateAsUndefined).processItem(this.result);
	}

	// evaluating object keys if they have nexl expressions
	if (j79.isObject(this.result)) {
		this.expandObjectKeys();
	}

	// array
	if (j79.isArray(this.result)) {
		this.result = new NexlEngine(this.context, this.isEvaluateAsUndefined).processItem(this.result);
	}
};

NexlExpressionEvaluator.prototype.makeDeepResolutionIfNeeded = function () {
	// reprocessing final result, it can contain sub expressions
	if (this.action !== undefined && this.needDeepResolution) {
		this.result = new NexlEngine(this.context, this.isEvaluateAsUndefined).processItem(this.result);
	}
};

NexlExpressionEvaluator.prototype.eval = function () {
	this.result = this.context;
	this.retrieveEvaluateAsUndefinedAction();
	this.actionsAsString = [];

	// iterating over actions
	for (this.actionNr = 0; this.actionNr < this.nexlExpressionMD.actions.length; this.actionNr++) {
		// deep resolution flag
		this.needDeepResolution = true;

		// current action
		this.action = this.nexlExpressionMD.actions[this.actionNr];

		this.specialCareForPropertyResolutionAction();

		// evaluating current action
		this.applyAction();

		// result may contain additional nexl expression with unlimited depth. resolving
		this.resolveSubExpressions();
	}

	// empty expression like ${}
	if (this.result === this.context) {
		this.result = undefined;
	}

	this.makeDeepResolutionIfNeeded();

	return this.result;
};

function NexlExpressionEvaluator(context, nexlExpressionMD) {
	this.context = context;
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

		// !U UNDEFINED_VALUE_OPERATIONS
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

		// !U UNDEFINED_VALUE_OPERATIONS
		if (evaluatedKey === undefined && this.isEvaluateAsUndefined) {
			continue;
		}

		// key must be a primitive. validating
		if (!j79.isPrimitive(evaluatedKey)) {
			throw util.format('Cannot assemble JavaScript object. The [%s] key is evaluated to a non-primitive data type %s', key, j79.getType(evaluatedKey));
		}

		var value = obj[key];
		value = this.processItem(value);

		// !U UNDEFINED_VALUE_OPERATIONS
		if (value === undefined && this.isEvaluateAsUndefined) {
			continue;
		}

		result[evaluatedKey] = value;
	}

	return result;
};

NexlEngine.prototype.processStringItem = function (str) {
	// parsing string
	var parsedStrMD = nexlExpressionsParser.parseStr(str);

	var data = {};
	data.chunks = parsedStrMD.chunks;
	data.chunkSubstitutions = parsedStrMD.chunkSubstitutions;
	data.str = str;

	// evaluating
	return new EvalAndSubstChunks(this.context, this.isEvaluateAsUndefined, data).evalAndSubstChunks();
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

function NexlEngine(context, isEvaluateAsUndefined) {
	this.context = context;
	this.isEvaluateAsUndefined = isEvaluateAsUndefined;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// exports
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.processItem = function (nexlSource, item, externalArgs) {
	var context = nexlEngineUtils.makeContext(nexlSource, externalArgs);

	// supplying nexl engine for functions in nexl-sources
	context.nexl.processItem = function (nexlExpression, externalArgs4Function) {
		// backing up current context before change
		var contextBackup = context;

		// merging externalArgs4Function to a context
		context = nexlEngineUtils.deepMergeInner(context, externalArgs4Function);

		var isEvaluateAsUndefined = nexlEngineUtils.hasEvaluateAsUndefinedFlag(context);

		// running nexl engine
		var result = new NexlEngine(context, isEvaluateAsUndefined).processItem(nexlExpression);

		// restoring context
		context = contextBackup;
		return result;
	};

	// should item be evaluated as undefined if it contains undefined variables ?
	var isEvaluateAsUndefined = nexlEngineUtils.hasEvaluateAsUndefinedFlag(context);

	// replacing \n and \t
	var item2Process = nexlEngineUtils.replaceSpecialChars(item);

	// is item not specified, using a default nexl expression
	item2Process = item2Process === undefined ? context.nexl.defaultExpression : item2Process;

	// running nexl engine
	return new NexlEngine(context, isEvaluateAsUndefined).processItem(item2Process);
};

// exporting resolveJsVariables
module.exports.resolveJsVariables = nexlSourceUtils.resolveJsVariables;

// separates string items by dots ( if not escaped ) and puts them into nested objects
module.exports.convertStrItems2Obj = nexlEngineUtils.convertStrItems2Obj;
