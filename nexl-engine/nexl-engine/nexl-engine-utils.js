/**************************************************************************************
 nexl-engine-utils

 Copyright (c) 2016-2017 Yevgeny Sergeyev
 License : Apache 2.0

 Set of utility functions for nexl-engine
 **************************************************************************************/

const nep = require('./nexl-expressions-parser');
const nsu = require('./nexl-source-utils');
const j79 = require('j79-utils');
const deepMerge = require('deepmerge');

const NO_NEED_DEEP_RESOLUTION_ACTIONS = [nep.ACTIONS.DEF_VALUE, nep.ACTIONS.APPEND_TO_ARRAY, nep.ACTIONS.JOIN_ARRAY_ELEMENTS, nep.ACTIONS.MANDATORY_VALUE];

const SPECIAL_CHARS_MAP = {
	'\\n': '\n',
	'\\t': '\t'
};

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

function makeContext(nexlSource, externalArgs) {
	// creating context
	var context = nsu.createContext(nexlSource);

	// merging defaultArgs to context
	if (j79.isObject(context.nexl.defaultArgs)) {
		context = deepMergeInner(context, context.nexl.defaultArgs);
	}

	// merging external args to context
	if (j79.isObject(externalArgs)) {
		context = deepMergeInner(context, externalArgs);
	}

	supplyStandardLibs(context);

	return context;
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

function replaceSpecialChar(item, char) {
	var lastPos = 0;
	var newStr = item;

	while ((lastPos = newStr.indexOf(char, lastPos)) >= 0) {
		var escaped = j79.escapePrecedingSlashes(newStr, lastPos);
		lastPos = escaped.correctedPos;
		newStr = escaped.escapedStr;

		if (escaped.escaped) {
			lastPos++;
			continue;
		}

		newStr = newStr.substr(0, lastPos) + SPECIAL_CHARS_MAP[char] + newStr.substr(lastPos + 2);
	}

	return newStr;
}


// string representation of \n, \t characters is replaced with their real value
function replaceSpecialChars(item) {
	if (!j79.isString(item)) {
		return item;
	}

	var result = item;

	var specialChars = Object.keys(SPECIAL_CHARS_MAP);
	for (var index in specialChars) {
		result = replaceSpecialChar(result, specialChars[index]);
	}

	return result;
}

function castInner(value, currentType, requiredTypeJs) {
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
}

// example : value = 101; nexlType = 'bool';
function cast(value, type) {
	// if type is not specified
	if (type === undefined) {
		return value;
	}

	// resolving JavaScript type
	var jsType = nep.NEXL_TYPES[type];

	// validating ( should not happen )
	if (jsType === undefined) {
		throw util.format('Unknown [%s] type in [%s] expression. Use one of the following types : [%s]', type, this.nexlExpressionMD.str, Object.keys(nep.NEXL_TYPES).join(','));
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

	return castInner(value, currentType, jsType);
}


function convertStrItem2Obj(item, val, obj) {
	var currentRef = obj;
	var currentItem = item;

	var lastDotPos = 0;
	while ((lastDotPos = currentItem.indexOf('.', lastDotPos)) >= 0) {
		var escaped = j79.escapePrecedingSlashes(currentItem, lastDotPos);
		lastDotPos = escaped.correctedPos;
		currentItem = escaped.escapedStr;
		if (escaped.escaped) {
			lastDotPos++;
			continue;
		}

		var key = currentItem.substr(0, lastDotPos);
		currentItem = currentItem.substr(lastDotPos + 1);
		if (currentRef[key] === undefined) {
			currentRef[key] = {};
		}
		currentRef = currentRef[key];
	}

	currentRef[currentItem] = val;
}

function extractTypeAndCast(value) {
	for (var nexlType in nep.NEXL_TYPES) {
	}

	return value;
}

// example obj =  { 'a.b.c.d': 10 }
// output : { a: {b: {c:{ d: 10}}}}
function convertStrItems2Obj(obj) {
	var result = {};
	for (var key in obj) {
		var val = obj[key];
		val = extractTypeAndCast(val);
		convertStrItem2Obj(key, val, result);
	}

	return result;
}

function produceKeyValuesPairs(rootKey, obj, result) {
	for (var key in obj) {
		var item = obj[key];

		var subKey = rootKey === undefined ? key : rootKey + '.' + key;

		if (j79.isObject(item)) {
			produceKeyValuesPairs(subKey, item, result);
			continue;
		}

		if (j79.isFunction(item)) {
			continue;
		}

		result.push(subKey + '=' + item);
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// exports
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.isNeedDeepResolution = isNeedDeepResolution;
module.exports.hasEvaluateAsUndefinedFlag = hasEvaluateAsUndefinedFlag;
module.exports.produceKeyValuesPairs = produceKeyValuesPairs;
module.exports.convertStrItems2Obj = convertStrItems2Obj;
module.exports.cast = cast;
module.exports.deepMergeInner = deepMergeInner;
module.exports.makeContext = makeContext;
module.exports.replaceSpecialChars = replaceSpecialChars;
