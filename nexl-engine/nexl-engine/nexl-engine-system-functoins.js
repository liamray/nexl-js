/**************************************************************************************
 nexl-engine-system-function

 Copyright (c) 2016-2017 Yevgeny Sergeyev
 License : Apache 2.0

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

// is string or array contains value
systemFunctions.isContains = function (entity, item) {
	if (j79.isArray(entity) || j79.isString(entity)) {
		return entity.indexOf(item) >= 0;
	}

	return entity;
};

systemFunctions.ifContains = function (entity, item, thenIf, elseIf) {
	if (j79.isArray(entity) || j79.isString(entity)) {
		return entity.indexOf(item) >= 0 ? thenIf : elseIf;
	}

	return entity;
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

systemFunctions.ifEquals = function (entity1, entity2, thenIf, elseIf) {
	return entity1 === entity2 ? thenIf : elseIf;
};

systemFunctions.isEquals = function (entity1, entity2) {
	return entity1 === entity2;
};

///////////////////////////////////////////////////////////////////////////////////////////
// assigning system functions to nexl context
///////////////////////////////////////////////////////////////////////////////////////////
module.exports.assign = function (context) {
	for (var item in systemFunctions) {
		context.nexl.functions.system[item] = systemFunctions[item];
	}
};