/**************************************************************************************
 nexl-engine-system-function

 Copyright (c) 2016-2017 Yevgeny Sergeyev
 License : Apache 2.0
 WebSite : http://www.nexl-js.com

 Set of utility functions to enhance nexl expressions functionality
 **************************************************************************************/

const j79 = require('j79-utils');
var systemFunctions = {};

///////////////////////////////////////////////////////////////////////////////////////////
// helper functions
///////////////////////////////////////////////////////////////////////////////////////////

// replace all in array or string
function replaceAll4Array(entity, searchItem, replace) {
	for (var index = 0; index < entity.length; index++) {
		if (entity[index] === searchItem) {
			entity[index] = replace;
		}
	}

	return entity;
}


///////////////////////////////////////////////////////////////////////////////////////////
// functions to assign to context
///////////////////////////////////////////////////////////////////////////////////////////

systemFunctions.makeObj = function (key, val) {
	var result = {};

	if (j79.isPrimitive(key)) {
		result[key] = val;
	}

	if (j79.isArray(key)) {
		for (var index in key) {
			result[key[index]] = val;
		}
	}

	return result;
};

// replaces items in array or string
systemFunctions.replaceAll = function (entity, searchItem, replace) {
	if (j79.isArray(entity)) {
		return replaceAll4Array(entity, searchItem, replace);
	}

	if (j79.isString(entity)) {
		return entity.replace(new RegExp(searchItem, 'g'), replace);
	}

	return entity;
};

systemFunctions.not = function (param) {
	if (j79.isBool(param)) {
		return !param;
	} else {
		return param;
	}
};

///////////////////////////////////////////////////////////////////////////////
// is*

// is string or array contains value
systemFunctions.isContains = function (entity, item) {
	if (j79.isArray(entity) || j79.isString(entity)) {
		return entity.indexOf(item) >= 0;
	}

	return entity;
};

systemFunctions.isEquals = function (entity1, entity2) {
	return entity1 === entity2;
};

systemFunctions.isBool = function (item) {
	return j79.isBool(item);
};

systemFunctions.isStr = function (item) {
	return j79.isString(item);
};

systemFunctions.isNum = function (item) {
	return j79.isNumber(item);
};

systemFunctions.isNull = function (item) {
	return item === null;
};

systemFunctions.isUndefined = function (item) {
	return item === undefined;
};

systemFunctions.isPrimitive = function (item) {
	return j79.isPrimitive(item);
};

systemFunctions.isArray = function (item) {
	return j79.isArray(item);
};

systemFunctions.isObject = function (item) {
	return j79.isObject(item);
};

///////////////////////////////////////////////////////////////////////////////
// if*

systemFunctions.ifContains = function (entity, item, thenIf, elseIf) {
	if (j79.isArray(entity) || j79.isString(entity)) {
		return entity.indexOf(item) >= 0 ? thenIf : elseIf;
	}

	return entity;
};

systemFunctions.ifEquals = function (entity1, entity2, thenIf, elseIf) {
	return systemFunctions.isEquals(entity1, entity2) ? thenIf : elseIf;
};

systemFunctions.ifBool = function (item, thenIf, elseIf) {
	return systemFunctions.isBool(item) ? thenIf : elseIf;
};

systemFunctions.ifStr = function (item, thenIf, elseIf) {
	return systemFunctions.isStr(item) ? thenIf : elseIf;
};

systemFunctions.ifNum = function (item, thenIf, elseIf) {
	return systemFunctions.isNum(item) ? thenIf : elseIf;
};

systemFunctions.ifNull = function (item, thenIf, elseIf) {
	return systemFunctions.isNull(item) ? thenIf : elseIf;
};

systemFunctions.ifUndefined = function (item, thenIf, elseIf) {
	return systemFunctions.isUndefined(item) ? thenIf : elseIf;
};

systemFunctions.ifPrimitive = function (item, thenIf, elseIf) {
	return systemFunctions.isPrimitive(item) ? thenIf : elseIf;
};

systemFunctions.ifArray = function (item, thenIf, elseIf) {
	return systemFunctions.isArray(item) ? thenIf : elseIf;
};

systemFunctions.ifObject = function (item, thenIf, elseIf) {
	return systemFunctions.isObject(item) ? thenIf : elseIf;
};

///////////////////////////////////////////////////////////////////////////////////////////
// assigning system functions to nexl context
///////////////////////////////////////////////////////////////////////////////////////////
module.exports.assign = function (context) {
	for (var item in systemFunctions) {
		context.nexl.functions.system[item] = systemFunctions[item];
	}
};