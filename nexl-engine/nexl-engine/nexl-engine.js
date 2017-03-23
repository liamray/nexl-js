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
// consts
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const THIS = '__this__';
const PARENT = '__parent__';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EvalAndSubstChunks
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

EvalAndSubstChunks.prototype.validate = function (chunk2Substitute, item) {
	if (!j79.isValSet(item)) {
		throw util.format('The [%s] expression is evaluated to [%s] and can\'t be substituted into [%s] string', chunk2Substitute.str, item, this.data.str);
	}

	if (!j79.isPrimitive(item)) {
		throw util.format('The internal expression [%s] cannot be evaluated as %s data type in [%s] expression( must be a primitive or array of primitives )', chunk2Substitute.str, j79.getType(item), this.data.str);
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
		var chunkValue = new NexlExpressionEvaluator(this.context, chunk2Substitute, this.data.objInfo).eval();

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
		return new NexlExpressionEvaluator(this.context, j79.getObjectValues(this.data.chunkSubstitutions)[0], this.data.objInfo).eval();
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

NexlExpressionEvaluator.prototype.try2ResolveNexlFuncs = function (key) {
	if (this.context.nexl.functions.user[key] !== undefined) {
		return this.context.nexl.functions.user[key];
	}

	if (this.context.nexl.functions.system[key] !== undefined) {
		return this.context.nexl.functions.system[key];
	}

	return undefined;
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

	// __parent__
	if (key == PARENT) {
		var val = this.result === this.context ? this.objInfo.parent : this.result[PARENT];
		val = val === this.context ? undefined : val;
		this.newResult.push(val);
		this.thisOrParentAreApplied = true;
		return;
	}

	// __this__
	if (key == THIS) {
		this.newResult.push(this.this);
		this.thisOrParentAreApplied = true;
		return;
	}

	var newResult = this.result[key];
	if (newResult === undefined && this.result === this.context) {
		newResult = this.try2ResolveNexlFuncs(key);
	}

	this.newResult.push(newResult);
};

NexlExpressionEvaluator.prototype.applyPropertyResolutionActionInner = function () {
	if (this.needDeepResolution4NextActions) {
		this.expandObjectKeys();
	}

	var resultBefore = this.result;
	this.thisOrParentAreApplied = false;

	var keys = j79.wrapWithArrayIfNeeded(this.assembledChunks);
	this.newResult = [];

	// iterating over keys
	for (var i in keys) {
		var key = keys[i];

		// resolving
		this.resolveObject(key);
	}

	this.result = j79.unwrapFromArrayIfPossible(this.newResult);

	// this.result and resultBefore must be a context
	// setting up a parent for this.result if it object and doesn't have parent
	// don't setup parent if __this__ or __parent__ was retrieved
	if (this.result !== this.context && resultBefore !== this.context && j79.isObject(this.result) && this.result[PARENT] === undefined && !this.thisOrParentAreApplied) {
		nexlEngineUtils.setReadOnlyProperty(this.result, PARENT, resultBefore);
	}
};

NexlExpressionEvaluator.prototype.assembleChunks4CurrentAction = function () {
	var data = {};
	data.chunks = this.action.actionValue.chunks;
	data.chunkSubstitutions = this.action.actionValue.chunkSubstitutions;
	data.objInfo = this.makeObjInfo();

	return new EvalAndSubstChunks(this.context, this.isEvaluateAsUndefined, data).evalAndSubstChunks();
};

NexlExpressionEvaluator.prototype.applyPropertyResolutionAction = function () {
	this.makeDeepResolution4String();

	// if not an object, skip action
	if (!j79.isObject(this.result)) {
		return;
	}

	this.assembledChunks = this.assembleChunks4CurrentAction();

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
	// not a function ? good bye
	if (!j79.isFunction(this.result)) {
		// reset function params stack
		this.funcParamsStack = [];
		return;
	}

	// copying params from stack
	var params = this.funcParamsStack.slice(0);

	// reset function params stack
	this.funcParamsStack = [];

	for (var index in this.action.actionValue) {
		var funcParamMD = this.action.actionValue[index];
		var funcParam = new NexlExpressionEvaluator(this.context, funcParamMD, this.makeObjInfo()).eval();
		params.push(funcParam);
	}

	this.result = this.result.apply(this.context, params);
	this.needDeepResolution4NextActions = true;
};

NexlExpressionEvaluator.prototype.resolveRealArrayIndex = function (item) {
	var arrayIndex;
	if (j79.isObject(item)) {
		arrayIndex = new NexlExpressionEvaluator(this.context, item, this.makeObjInfo()).eval();
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
		throw util.format('The [%s] nexl expression used in array index cannot be evaluated as %s. It must be an integer number or "^" or "$" characters. Expressions is [%s], actionNr is [%s]', item.str, j79.getType(arrayIndex), this.nexlExpressionMD.str, this.actionNr + 1);
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

	this.makeDeepResolution();

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
	this.makeDeepResolution4String();

	if (j79.isString(this.result)) {
		this.evalArrayIndexesAction4String();
		return;
	}

	if (j79.isArray(this.result)) {
		this.evalArrayIndexesAction4Array();
		return;
	}
};

NexlExpressionEvaluator.prototype.applyDefaultValueAction = function () {
	this.makeDeepResolution4String();

	// is value not set for this.result ?
	if (this.result !== undefined) {
		// don't need to a apply default value action
		return;
	}

	this.result = this.assembleChunks4CurrentAction();
	this.needDeepResolution4NextActions = false;
};

NexlExpressionEvaluator.prototype.applyCastAction = function () {
	this.makeDeepResolution4String();
	this.result = nexlEngineUtils.cast(this.result, this.action.actionValue);
};

NexlExpressionEvaluator.prototype.convert2Object = function () {
	this.makeDeepResolution4String();

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
	this.makeDeepResolution4String();

	if (!j79.isObject(this.result)) {
		return;
	}

	if (this.needDeepResolution4NextActions) {
		this.expandObjectKeys();
	}

	this.result = Object.keys(this.result);
};

NexlExpressionEvaluator.prototype.resolveObjectValues = function () {
	this.makeDeepResolution4String();

	if (!j79.isObject(this.result)) {
		return;
	}

	this.makeDeepResolution();

	this.result = j79.obj2ArrayIfNeeded(this.result);
	this.result = j79.unwrapFromArrayIfPossible(this.result);
};

NexlExpressionEvaluator.prototype.produceKeyValuesPairs = function () {
	this.makeDeepResolution4String();

	if (!j79.isObject(this.result)) {
		return;
	}

	this.makeDeepResolution();

	var result = [];
	nexlEngineUtils.produceKeyValuesPairs(undefined, this.result, result);

	this.result = result.join('\n');
	this.needDeepResolution4NextActions = false;
};

NexlExpressionEvaluator.prototype.produceXML = function () {
	this.makeDeepResolution4String();

	if (!j79.isObject(this.result)) {
		return;
	}

	this.makeDeepResolution();

	var root = this.actionsAsString.length < 1 ? 'root' : this.actionsAsString.join('.');
	this.result = js2xmlparser.parse(root, this.result);
	this.needDeepResolution4NextActions = false;
};

NexlExpressionEvaluator.prototype.produceYAML = function () {
	this.makeDeepResolution4String();

	if (!j79.isObject(this.result)) {
		return;
	}

	this.makeDeepResolution();

	this.result = YAML.stringify(this.result);
	this.needDeepResolution4NextActions = false;
};

NexlExpressionEvaluator.prototype.applyObjectOperationsAction = function () {
	var actionValue = this.action.actionValue;

	switch (actionValue) {
		// ~O
		case nexlExpressionsParser.OBJECT_OPERATIONS_OPTIONS.CONVERT_TO_OBJECT : {
			this.convert2Object();
			return;
		}

		// ~K
		case nexlExpressionsParser.OBJECT_OPERATIONS_OPTIONS.RESOLVE_KEYS : {
			this.resolveObjectKeys();
			return;
		}

		// ~V
		case nexlExpressionsParser.OBJECT_OPERATIONS_OPTIONS.RESOLVE_VALUES : {
			this.resolveObjectValues();
			return;
		}

		// ~P
		case nexlExpressionsParser.OBJECT_OPERATIONS_OPTIONS.PRODUCE_KEY_VALUE_PAIRS : {
			this.produceKeyValuesPairs();
			return;
		}

		// ~X
		case nexlExpressionsParser.OBJECT_OPERATIONS_OPTIONS.PRODUCE_XML : {
			this.produceXML();
			return;
		}

		// ~Y
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

NexlExpressionEvaluator.prototype.applyObjectKeyReverseResolutionAction = function () {
	this.makeDeepResolution4String();

	// reverse resolution action is applying only for objects
	if (!j79.isObject(this.result)) {
		return;
	}

	this.makeDeepResolution();

	// assembling action value
	var reverseKey = this.assembleChunks4CurrentAction();

	var newResult = [];

	// iterating over keys in this.result and checking
	for (var key in this.result) {
		var item = this.result[key];

		if (this.isContainsValue(item, reverseKey)) {
			newResult.push(key);
		}
	}

	this.result = newResult;
	this.needDeepResolution4NextActions = false;
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
	this.makeDeepResolution4String();

	// is convert to array ?
	if (this.action.actionValue === nexlExpressionsParser.ARRAY_OPERATIONS_OPTIONS.CONVERT_TO_ARRAY) {
		this.convert2Array();
		return;
	}

	// not an array ? bye bye
	if (!j79.isArray(this.result)) {
		return;
	}

	this.makeDeepResolution();

	switch (this.action.actionValue) {
		// #S
		case nexlExpressionsParser.ARRAY_OPERATIONS_OPTIONS.SORT_ASC: {
			this.result = this.result.sort();
			return;
		}

		// #s
		case nexlExpressionsParser.ARRAY_OPERATIONS_OPTIONS.SORT_DESC: {
			this.result = this.result.sort();
			this.result = this.result.reverse();
			return;
		}

		// #U
		case nexlExpressionsParser.ARRAY_OPERATIONS_OPTIONS.UNIQUE: {
			this.makeUniq();
			return;
		}

		// #D
		case nexlExpressionsParser.ARRAY_OPERATIONS_OPTIONS.DUPLICATES: {
			this.makeDuplicates();
			return;
		}

		// #LEN
		case nexlExpressionsParser.ARRAY_OPERATIONS_OPTIONS.LENGTH: {
			this.result = this.result.length;
			return;
		}

		// #F
		case nexlExpressionsParser.ARRAY_OPERATIONS_OPTIONS.GET_FIRST_OR_NOTHING: {
			this.result = this.result.length === 1 ? this.result[0] : undefined;
			return;
		}
	}
};

NexlExpressionEvaluator.prototype.eliminateAllFromArray = function (value) {
	var index;
	while ((index = this.result.indexOf(value)) >= 0) {
		this.result.splice(index, 1);
	}
};

NexlExpressionEvaluator.prototype.applyEliminateArrayElements = function () {
	this.makeDeepResolution();

	// resolving action value
	var actionValue = this.assembleChunks4CurrentAction();

	// wrapping with array
	actionValue = j79.wrapWithArrayIfNeeded(actionValue);

	// iterating over actionValue and eliminating array elements
	for (var index in actionValue) {
		var item = actionValue[index];
		this.eliminateAllFromArray(item);
	}
};

NexlExpressionEvaluator.prototype.applyEliminateObjectProperties = function () {
	if (this.needDeepResolution4NextActions) {
		this.expandObjectKeys();
	}

	// resolving action value
	var actionValue = this.assembleChunks4CurrentAction();

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
	this.makeDeepResolution4String();

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
	var actionValue = this.assembleChunks4CurrentAction();

	// if actionValue is array, merging 2 arrays. otherwise just pushing a value to existing
	if (j79.isArray(actionValue)) {
		this.result = this.result.concat(actionValue);
	} else {
		this.result.push(actionValue);
	}
};

NexlExpressionEvaluator.prototype.mergeObjects = function () {
	// resolving action value
	var actionValue = this.assembleChunks4CurrentAction();

	if (!j79.isObject(actionValue)) {
		return;
	}

	this.result = nexlEngineUtils.deepMergeInner(this.result, actionValue);
};

NexlExpressionEvaluator.prototype.applyAppendMergeAction = function () {
	this.makeDeepResolution4String();

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
	this.makeDeepResolution4String();

	// not an array ? bye bye
	if (!j79.isArray(this.result)) {
		return;
	}

	this.makeDeepResolution();

	// resolving action value
	var actionValue = this.assembleChunks4CurrentAction();

	// validating action value
	if (!j79.isPrimitive(actionValue)) {
		throw util.format('Array elements cannot be joined with %s type in [%s] expression. Use a primitive data types to join array elements', j79.getType(actionValue), this.nexlExpressionMD.str);
	}

	this.result = this.result.join(actionValue);
	this.needDeepResolution4NextActions = false;
};

NexlExpressionEvaluator.prototype.applyStringOperationsAction = function () {
	this.makeDeepResolution4String();

	// not a string ? good bye
	if (!j79.isString(this.result)) {
		return;
	}

	this.needDeepResolution4NextActions = false;

	switch (this.action.actionValue) {
		// ^U
		case nexlExpressionsParser.STRING_OPERATIONS_OPTIONS.UPPERCASE: {
			this.result = this.result.toUpperCase();
			return;
		}

		// ^U1
		case nexlExpressionsParser.STRING_OPERATIONS_OPTIONS.CAPITALIZE_FIRST_LETTER: {
			this.result = this.result.charAt(0).toUpperCase() + this.result.slice(1);
			return;
		}

		// ^L
		case nexlExpressionsParser.STRING_OPERATIONS_OPTIONS.LOWERCASE: {
			this.result = this.result.toLowerCase();
			return;
		}

		// ^LEN
		case nexlExpressionsParser.STRING_OPERATIONS_OPTIONS.LENGTH: {
			this.result = this.result.length;
			return;
		}

		// ^T
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

	this.makeDeepResolution4String();

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

NexlExpressionEvaluator.prototype.applyMandatoryValueValidatorAction = function () {
	this.makeDeepResolution4String();

	if (this.result !== undefined) {
		return;
	}

	var defaultErrorMessage = util.format('The [%s] expression cannot be evaluated to undefined ( it has a mandatory value validator ). Probably you have to provide it as external arg or check why it calculated to undefined', this.nexlExpressionMD.str);

	// does this action have a custom error message ?
	if (this.action.actionValue.chunks[0] === '') {
		// default error message
		throw defaultErrorMessage;
	}

	// resolving custom error message
	var customErrorMessage;
	try {
		customErrorMessage = this.assembleChunks4CurrentAction();
	} catch (e) {
		throw util.format('%s\nFailed to evaluate custom error message. Reason : %s', defaultErrorMessage, e);
	}

	throw customErrorMessage;
};


NexlExpressionEvaluator.prototype.applyPushFunctionParamAction = function () {
	this.makeDeepResolution();
	this.funcParamsStack.push(this.result);
	this.init(this.actionNr + 1);
};

NexlExpressionEvaluator.prototype.makeDeepResolution4String = function () {
	if (!j79.isString(this.result)) {
		return;
	}

	this.makeDeepResolution();
	this.needDeepResolution4NextActions = false;
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
		case nexlExpressionsParser.ACTIONS.FUNCTION_CALL: {
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

		// < object key reverse resolution action
		case nexlExpressionsParser.ACTIONS.OBJECT_KEY_REVERSE_RESOLUTION: {
			this.applyObjectKeyReverseResolutionAction();
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
		case nexlExpressionsParser.ACTIONS.MANDATORY_VALUE_VALIDATOR: {
			this.applyMandatoryValueValidatorAction();
			return;
		}

		// push current result
		case nexlExpressionsParser.ACTIONS.PUSH_FUNCTION_PARAM: {
			this.applyPushFunctionParamAction();
			return;
		}
	}

	throw util.format('The [%s] action in [%s] expression is reserved for future purposes. If you need to use this character in nexl expression, escape it', this.action.actionId, this.nexlExpressionMD.str);
};

NexlExpressionEvaluator.prototype.init = function (actionNr) {
	this.actionsAsString = [];
	this.needDeepResolution4NextActions = true;
	this.this = this.objInfo.this;
	this.lastObjResult = undefined;

	// if there is no actions, the result is undefined
	if (this.nexlExpressionMD.actions.length - 1 < actionNr) {
		this.result = undefined;
		return;
	}

	// retrieving first action
	var action = this.nexlExpressionMD.actions[actionNr];

	// if first action is PROPERTY_RESOLUTION, result is assigning to context, otherwise to undefined
	if (action.actionId === nexlExpressionsParser.ACTIONS.PROPERTY_RESOLUTION) {
		this.result = this.context;
	} else {
		this.result = undefined;
	}
};


NexlExpressionEvaluator.prototype.expandObjectKeys = function () {
	// not relevant for standard libraries
	if (this.result === Math || this.result === Number || this.result === Date || this.result == this.context) {
		return;
	}

	var newResult = {};
	var objInfo = this.makeObjInfo();
	var nexlEngine = new NexlEngine(this.context, this.isEvaluateAsUndefined);

	for (var key in this.result) {
		// nexilized key
		var newKey = nexlEngine.processItem(key, objInfo);

		// key must be a primitive. checking...
		if (!j79.isPrimitive(newKey)) {
			throw util.format('Cannot assemble JavaScript object. The [%s] key is evaluated to a non-primitive data type %s', key, j79.getType(newKey));
		}

		newResult[newKey] = this.result[key];
	}

	// copying non enumerable __parent__ property from this.result to newResult
	nexlEngineUtils.setReadOnlyProperty(newResult, PARENT, this.result[PARENT]);

	this.result = newResult;
};

NexlExpressionEvaluator.prototype.makeObjInfo = function () {
	return {
		this: this.objInfo.this,
		parent: this.objInfo.parent
	};
};

NexlExpressionEvaluator.prototype.makeDeepResolution = function () {
	if (this.needDeepResolution4NextActions) {
		var oi = {
			this: this.lastObjResult,
			parent: this.lastObjResult === undefined ? this.objInfo.parent : this.lastObjResult[PARENT]
		};

		this.result = new NexlEngine(this.context, this.isEvaluateAsUndefined).processItem(this.result, oi);
	}
};

NexlExpressionEvaluator.prototype.eval = function () {
	this.init(0);
	this.retrieveEvaluateAsUndefinedAction();

	// iterating over actions
	for (this.actionNr = 0; this.actionNr < this.nexlExpressionMD.actions.length; this.actionNr++) {
		// current action
		this.action = this.nexlExpressionMD.actions[this.actionNr];

		// evaluating current action
		this.applyAction();

		if (j79.isObject(this.result) && this.result !== this.context) {
			this.this = this.result;
			this.lastObjResult = this.result;
		}
	}

	this.makeDeepResolution();

	return this.result;
};

function NexlExpressionEvaluator(context, nexlExpressionMD, objInfo) {
	this.context = context;
	this.nexlExpressionMD = nexlExpressionMD;
	this.objInfo = objInfo;

	this.funcParamsStack = [];
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NexlEngine
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


NexlEngine.prototype.processArrayItem = function (arr, objInfo) {
	var result = [];

	for (var index in arr) {
		var arrItem = arr[index];
		var item = this.processItem(arrItem, objInfo);

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

NexlEngine.prototype.processObjectItem = function (obj, objInfo) {
	// cloning obj object as result object because we need to know his computable values
	// for example : { a:'1', b:'${__this__.b}', inner: {c:'${__parent__.b}'} } will not work for inner.c if obj is not cloned
	var result = nexlEngineUtils.deepMergeInner({}, obj);

	// copying a __parent__ property
	var parent = obj[PARENT] === undefined ? objInfo.parent : obj[PARENT];
	nexlEngineUtils.setReadOnlyProperty(result, PARENT, parent);

	// result keys
	var keys = Object.keys(result);

	// this object info is applied for sub objects
	var parent4Objects = {
		parent: result
	};

	// this object info is applied for non object, for example for strings
	var parent4Others = {
		this: result,
		parent: result[PARENT]
	};

	// iterating over over keys and evaluating
	for (var index in keys) {
		var key = keys[index];
		var evaluatedKey = this.processItem(key, parent4Others);

		// !U UNDEFINED_VALUE_OPERATIONS
		if (evaluatedKey === undefined && this.isEvaluateAsUndefined) {
			delete result[key];
			continue;
		}

		// key must be a primitive. validating
		if (!j79.isPrimitive(evaluatedKey)) {
			throw util.format('Cannot assemble JavaScript object. The [%s] key is evaluated to a non-primitive data type %s', key, j79.getType(evaluatedKey));
		}

		var value = result[key];
		value = this.processItem(value, j79.isObject(value) ? parent4Objects : parent4Others);
		delete result[key];

		// !U UNDEFINED_VALUE_OPERATIONS
		if (value === undefined && this.isEvaluateAsUndefined) {
			continue;
		}

		result[evaluatedKey] = value;
	}

	return result;
};

NexlEngine.prototype.processStringItem = function (str, objInfo) {
	// parsing string
	var parsedStrMD = nexlExpressionsParser.parseStr(str);

	var data = {};
	data.chunks = parsedStrMD.chunks;
	data.chunkSubstitutions = parsedStrMD.chunkSubstitutions;
	data.str = str;
	data.objInfo = objInfo;

	// evaluating
	return new EvalAndSubstChunks(this.context, this.isEvaluateAsUndefined, data).evalAndSubstChunks();
};

NexlEngine.prototype.processItem = function (item, aObjInfo) {
	var objInfo = aObjInfo || {};

	// iterates over each array element and processes every item
	if (j79.isArray(item)) {
		return this.processArrayItem(item, objInfo);
	}

	// iterates over object keys and values and processes them
	if (j79.isObject(item)) {
		return this.processObjectItem(item, objInfo);
	}

	// not supported !
	if (j79.isFunction(item)) {
		return item;
	}

	// actually the only string elements are really being processed
	if (j79.isString(item)) {
		return this.processStringItem(item, objInfo);
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

module.exports.nexlize = function (nexlSource, item, externalArgs) {
	// creating context
	var context = nexlEngineUtils.makeContext(nexlSource, externalArgs, NexlEngine);

	// replacing \n and \t with their real ASCII code
	var item2Process = nexlEngineUtils.replaceSpecialChars(item);

	// should item be evaluated as undefined if it contains undefined variables ?
	var isEvaluateAsUndefined = nexlEngineUtils.hasEvaluateAsUndefinedFlag(context);

	// is item not specified, using a default nexl expression
	item2Process = ( item2Process === undefined ) ? context.nexl.defaultExpression : item2Process;

	// running nexl engine
	return new NexlEngine(context, isEvaluateAsUndefined).processItem(item2Process);
};

// exporting resolveJsVariables
module.exports.resolveJsVariables = nexlSourceUtils.resolveJsVariables;

// separates string items by dots ( if not escaped ) and puts them into nested objects
module.exports.convertStrItems2Obj = nexlEngineUtils.convertStrItems2Obj;
