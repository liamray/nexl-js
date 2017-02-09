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

function deepMergeInner(obj1, obj2) {
	if (obj2 === undefined) {
		return obj1;
	}

	return deepMerge(obj1, obj2);
}

function resolveModifierConstantValue(modifier) {
	var parsedStrMD = modifier.md;

	if (parsedStrMD.chunks.length !== 1 || parsedStrMD.chunks[0] === null) {
		throw util.format('Invalid nexl expression. The [%s] modifier can have only constant value and cannot contain sub expressions', modifier.id);
	}

	return parsedStrMD.chunks[0];
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EvalAndSubstChunks
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

EvalAndSubstChunks.prototype.validate = function (chunk2Substitute, item) {
	if (!j79.isValSet(item)) {
		throw util.format('Cannot substitute [%s] value into [%s]', item, chunk2Substitute.str);
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

		// EVALUATE_AS_UNDEFINED modifier
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

NexlExpressionEvaluator.prototype.expandObjectKeys = function () {
	var newResult = {};
	var nexlEngine = new NexlEngine(this.session);

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
	if (j79.isString(this.result) && nep.hasSubExpression(this.result)) {
		this.result = new NexlEngine(this.session).processItem(this.result);
	}

	// evaluating object keys if they have nexl expressions
	if (j79.isObject(this.result)) {
		this.expandObjectKeys();
	}
};


NexlExpressionEvaluator.prototype.forwardUpAndPush = function (key, item) {
	if (!j79.isValSet(item) || j79.isPrimitive(item)) {
		this.newResult.push(item);
		return;
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
		this.forwardUpAndPush(key, currentResultItem);
		this.newExternalArgsPointer[newResultLastItemIndex] = undefined;
		return;
	}

	// forwarding up the external arg
	currentExternalArg = currentExternalArg[key];

	if (currentExternalArg === undefined) {
		this.forwardUpAndPush(key, currentResultItem);
		this.newExternalArgsPointer[newResultLastItemIndex] = undefined;
		return;
	}

	// is it object ? ( array and function are also kind of objects )
	if (!j79.isPrimitive(currentExternalArg)) {
		this.forwardUpAndPush(key, currentResultItem);
		this.newExternalArgsPointer[newResultLastItemIndex] = currentExternalArg;
		return;
	}

	// ok, it's a primitive. going to override the currentResultItem.
	// but first validating. is cannot contain nexl expression
	if (nep.hasSubExpression(currentExternalArg)) {
		throw util.format('External argument [%s] cannot contain nexl expression. It can be only a primitive', currentExternalArg);
	}

	// it's ok, overriding
	this.newResult.push(currentExternalArg);
	this.newExternalArgsPointer[newResultLastItemIndex] = undefined;
};

NexlExpressionEvaluator.prototype.evalObjectActionInner = function () {
	this.newResult = [];
	this.newExternalArgsPointer = [];
	var keys = j79.wrapWithArrayIfNeeded(this.assembledChunks);
	var isArrayFlag = j79.isArray(this.result);
	var currentResult = j79.wrapWithArrayIfNeeded(this.result);

	// iterating over keys
	for (var i in keys) {
		var key = keys[i];

		// key must be only a primitive. checking
		if (!j79.isPrimitive(key)) {
			throw util.format('The subexpression of [%s] expression cannot be evaluated as %s at the [%s] chunk', this.nexlExpressionMD.str, j79.getType(key), this.chunkNr + 1);
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

NexlExpressionEvaluator.prototype.validate = function () {
	if (!j79.isPrimitive(this.assembledChunks) && !j79.isArray(this.assembledChunks)) {
		throw util.format('The subexpression of [%s] expression cannot be evaluated as %s at the [%s] chunk', this.nexlExpressionMD.str, j79.getType(this.assembledChunks), this.chunkNr + 1);
	}
};

NexlExpressionEvaluator.prototype.evalObjectAction = function () {
	var data = {};
	data.chunks = this.action.chunks;
	data.chunkSubstitutions = this.action.chunkSubstitutions;

	// assembledChunks is string
	this.assembledChunks = new EvalAndSubstChunks(this.session, data).evalAndSubstChunks();

	// skipping object resolution for undefined key
	if (this.assembledChunks === undefined) {
		return;
	}

	this.validate();

	// resolving value from last this.result
	this.evalObjectActionInner();
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

NexlExpressionEvaluator.prototype.evalItemIfNeeded = function (item) {
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
	var min = this.evalItemIfNeeded(item['min']);
	var max = this.evalItemIfNeeded(item['max']);

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
	if (j79.isString(this.result)) {
		this.evalArrayIndexesAction4String();
		return;
	}

	if (j79.isValSet(this.result)) {
		this.evalArrayIndexesAction4Array();
		return;
	}
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
NexlExpressionEvaluator.prototype.cast = function (value, nexlType) {
	// if type is not specified
	if (nexlType === undefined) {
		return value;
	}

	// resolving JavaScript type
	var requiredTypeJs = nep.NEXL_TYPES[nexlType];

	// validating ( should not happen )
	if (requiredTypeJs === undefined) {
		throw util.format('Unknown [%s] type', nexlType);
	}

	// resolving type for value
	var currentType = j79.getType(value);

	// if both types are same, return value as is
	if (currentType === requiredTypeJs) {
		return value;
	}

	// everything is being casted to null
	if (requiredTypeJs === nep.JS_PRIMITIVE_TYPES.NULL) {
		return null;
	}

	return this.castInner(value, currentType, requiredTypeJs);
};

NexlExpressionEvaluator.prototype.resolveModifierValue = function (modifier) {
	// evaluating modifier value
	var modifierMd = modifier.md;
	var type = modifier.type;

	var data = {};
	data.chunks = modifierMd.chunks;
	data.chunkSubstitutions = modifierMd.chunkSubstitutions;

	var modifierValue = new EvalAndSubstChunks(this.session, data).evalAndSubstChunks();
	return this.cast(modifierValue, type);
};

NexlExpressionEvaluator.prototype.applyDefaultValueModifier = function (modifier) {
	// is value set for this.result ?
	if (this.result !== undefined) {
		// don't need to apply default value modifier
		return;
	}

	this.result = this.resolveModifierValue(modifier);
};

NexlExpressionEvaluator.prototype.forceMakeObject = function () {
	var key = this.assembledChunks;

	if (key === undefined) {
		key = 'obj';
	}

	if (j79.isArray(key)) {
		key = key.join('.');
	}

	var obj = {};
	obj[key] = this.result;
	this.result = obj;
};

NexlExpressionEvaluator.prototype.applyObjectOperationsModifier = function (modifier) {
	// value of object operations modifiers must be a constant ( cannot be evaluated as nexl expression ). so resolving it from first chunk of parsedStr
	var modifierVal = resolveModifierConstantValue(modifier);

	// applying ~O for non-objects
	if (!j79.isObject(this.result) && modifierVal === 'O') {
		this.forceMakeObject();
	}

	// not an object ? bye bye
	if (!j79.isObject(this.result)) {
		return;
	}

	// resolving keys for ~K
	if (modifierVal === 'K') {
		this.result = Object.keys(this.result);
		return;
	}

	// resolving values for ~V
	if (modifierVal === 'V') {
		this.result = j79.obj2ArrayIfNeeded(this.result);
		return;
	}

	throw util.format('Invalid nexl expression. Got unknown modificator [%s] for [%s] modifier', modifierVal, modifier.id);
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

NexlExpressionEvaluator.prototype.resolveReverseKey = function (reverseKey) {
	var newResult = [];

	for (var key in this.result) {
		var item = this.result[key];

		if (this.isContainsValue(item, reverseKey)) {
			newResult.push(key);
		}
	}

	this.result = newResult.length > 0 ? newResult : undefined;
};

NexlExpressionEvaluator.prototype.applyObjectReverseResolutionModifier = function (modifier) {
	// reverse resolution modifier is applying only for objects
	if (!j79.isObject(this.result)) {
		return;
	}

	// resolving modifier value
	var modifierValue = this.resolveModifierValue(modifier);

	// resolving reverse key and assigning
	this.resolveReverseKey(modifierValue);
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

// #S, #s, #U, #C array operations modifier
NexlExpressionEvaluator.prototype.applyArrayOperationsModifier = function (modifier) {
	// not an array ? bye bye
	if (!j79.isArray(this.result)) {
		return;
	}

	var modifierValue = resolveModifierConstantValue(modifier);

	switch (modifierValue) {
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

		// count
		case 'C': {
			this.result = this.result.length;
			return;
		}

	}

	throw util.format('Invalid nexl expression. Got unknown modificator [%s] for [%s] modifier', modifierValue, modifier.id);
};

NexlExpressionEvaluator.prototype.applyEliminateArrayElementsModifier = function (modifier) {
	// not an array ? bye bye
	if (!j79.isArray(this.result)) {
		return;
	}

	// resolving modifier value
	var modifierValue = this.resolveModifierValue(modifier);

	// wrapping with array
	modifierValue = j79.wrapWithArrayIfNeeded(modifierValue);

	// iterating over modifierValue and eliminating array elements
	for (var index in modifierValue) {
		var item = modifierValue[index];
		var removeCandidate = this.result.indexOf(item);
		if (removeCandidate < 0) {
			continue;
		}

		this.result.splice(removeCandidate, 1);
	}
};

NexlExpressionEvaluator.prototype.applyJoinArrayElementsModifier = function (modifier) {
	// not an array ? bye bye
	if (!j79.isArray(this.result)) {
		return;
	}

	// resolving modifier value
	var modifierValue = this.resolveModifierValue(modifier);

	// validating modifier value
	if (!j79.isPrimitive(modifierValue)) {
		throw util.format('Array elements cannot be joined with %s type in [%s] expression. Use primitive data types to join array elements', j79.getType(modifierValue), this.nexlExpressionMD.str);
	}

	this.result = this.result.join(modifierValue);
};

NexlExpressionEvaluator.prototype.applyStringOperationsModifier = function (modifier) {
	// not a string ? good bye
	if (!j79.isString(this.result)) {
		return;
	}

	var modifierValue = resolveModifierConstantValue(modifier);

	switch (modifierValue) {
		// upper case
		case 'U': {
			this.result = this.result.toUpperCase();
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

	throw util.format('Invalid nexl expression. Got unknown modificator [%s] for [%s] modifier', modifierValue, modifier.id);

};

NexlExpressionEvaluator.prototype.applyModifier = function (modifier) {
	switch (modifier.id) {
		// @ default value modifier
		case nep.MODIFIERS.DEF_VALUE: {
			this.applyDefaultValueModifier(modifier);
			return;
		}

		// ~K, ~V, ~O object operations modifier
		case nep.MODIFIERS.OBJECT_OPERATIONS: {
			this.applyObjectOperationsModifier(modifier);
			return;
		}

		// < object reverse resolution modifier
		case nep.MODIFIERS.OBJECT_REVERSE_RESOLUTION: {
			this.applyObjectReverseResolutionModifier(modifier);
			return;
		}

		// #S, #s, #U, #C array operations modifier
		case nep.MODIFIERS.ARRAY_OPERATIONS: {
			this.applyArrayOperationsModifier(modifier);
			return;
		}

		// - eliminate array elements modifier
		case nep.MODIFIERS.ELIMINATE_ARRAY_ELEMENTS: {
			this.applyEliminateArrayElementsModifier(modifier);
			return;
		}

		// & join array elements modifier
		case nep.MODIFIERS.JOIN_ARRAY_ELEMENTS: {
			this.applyJoinArrayElementsModifier(modifier);
			return;
		}

		// ^U, ^L, ^LEN, ^T string operations modifier
		case nep.MODIFIERS.STRING_OPERATIONS: {
			this.applyStringOperationsModifier(modifier);
			return;
		}

		// eval as undefined modifier
		case nep.MODIFIERS.EVALUATE_AS_UNDEFINED: {
			return;
		}
	}

	throw util.format('Probably parser error, got unknown modifier [%s]', modifier.id);
};

NexlExpressionEvaluator.prototype.applyModifiers = function () {
	// iterating over modifiers and applying them
	for (var index in this.nexlExpressionMD.modifiers) {
		var modifier = this.nexlExpressionMD.modifiers[index];
		this.applyModifier(modifier);
	}
};

NexlExpressionEvaluator.prototype.eval = function () {
	this.result = this.session.context;
	this.externalArgsPointer = [this.session.externalArgs];
	this.session.EVALUATE_AS_UNDEFINED = ( this.nexlExpressionMD.modifiers[nep.MODIFIERS.EVALUATE_AS_UNDEFINED] !== undefined );

	// iterating over actions
	for (this.chunkNr = 0; this.chunkNr < this.nexlExpressionMD.actions.length; this.chunkNr++) {
		// current action
		this.action = this.nexlExpressionMD.actions[this.chunkNr];

		// evaluating current action
		this.evalAction();

		// result may contain additional nexl expression with unlimited depth. resolving
		this.resolveSubExpressions();
	}

	// empty expression like ${}
	if (this.result === this.session.context) {
		this.result = undefined;
	}

	// reprocessing final result, it can contain sub expressions
	this.result = new NexlEngine(this.session).processItem(this.result);

	this.applyModifiers();

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

		// EVALUATE_AS_UNDEFINED modifier
		if (item === undefined && this.isEvaluateAsUndefined) {
			return undefined;
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

		// EVALUATE_AS_UNDEFINED modifier
		if (evaluatedKey === undefined && this.isEvaluateAsUndefined) {
			return undefined;
		}

		// key must be a primitive. validating
		if (!j79.isPrimitive(evaluatedKey)) {
			throw util.format('Cannot assemble JavaScript object. The [%s] key is evaluated to a non-primitive data type %s', key, j79.getType(evaluatedKey));
		}

		var value = obj[key];
		value = this.processItem(value);

		// EVALUATE_AS_UNDEFINED modifier
		if (value === undefined && this.isEvaluateAsUndefined) {
			return undefined;
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

function NexlEngine(session) {
	this.session = session;
	this.isEvaluateAsUndefined = this.session.EVALUATE_AS_UNDEFINED;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// exports
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.processItem = function (nexlSource, item, externalArgs) {
	var session = {};
	session.externalArgs = externalArgs;
	session.EVALUATE_AS_UNDEFINED = ( ( externalArgs || {} ).nexl || {} ).EVALUATE_AS_UNDEFINED === true;

	// creating context
	session.context = nsu.createContext(nexlSource);

	// adding nexl object to the context
	session.context.nexl = {};

	// giving an access to arguments for functions in nexl-sources
	session.context.nexl.args = externalArgs;

	// supplying nexl engine for functions in nexl-sources
	session.context.nexl.processItem = function (nexlExpression, externalArgs4Function) {
		// merging existing external args
		session.externalArgs = deepMergeInner(externalArgs, externalArgs4Function);
		var result = new NexlEngine(session).processItem(nexlExpression);
		session.externalArgs = externalArgs;
		return result;
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

// exporting resolveJsVariables
module.exports.resolveJsVariables = nsu.resolveJsVariables;
