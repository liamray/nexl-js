/**************************************************************************************
 nexl-engine-system-function

 Copyright (c) 2016-2017 Yevgeny Sergeyev
 License : Apache 2.0

 Set of utility functions to enhance nexl expressions functionality
 **************************************************************************************/

const j79 = require('j79-utils');

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
function isContains(entity, item) {
	if (j79.isArray(entity) || j79.isString(entity)) {
		return entity.indexOf(item) >= 0;
	}

	return entity;
}

function ifContains(entity, item, thenIf, elseIf) {
	if (j79.isArray(entity) || j79.isString(entity)) {
		return entity.indexOf(item) >= 0 ? thenIf : elseIf;
	}

	return entity;
}

// replaces items in array or string
function replaceAll(entity, searchItem, replace) {
	if (j79.isArray(entity)) {
		return replaceAll4Array(entity, searchItem, replace);
	}

	if (j79.isString(entity)) {
		return entity.replace(new RegExp(searchItem, 'g'), replace);
	}

	return entity;
}

function test() {
	return 'Zhenya+';
}

function add() {
	var result = '';
	for (var index = 0; index < arguments.length; index++) {
		result += arguments[index];
	}

	return result;
}

function not(param) {
	if (j79.isBool(param)) {
		return !param;
	} else {
		return param;
	}
}

function ifEquals(entity1, entity2, thenIf, elseIf) {
	return entity1 === entity2 ? thenIf : elseIf;
}

function isEquals(entity1, entity2) {
	return entity1 === entity2;
}

///////////////////////////////////////////////////////////////////////////////////////////
// assigning system functions to nexl context
///////////////////////////////////////////////////////////////////////////////////////////
module.exports.assign = function (context) {
	context.nexl.functions.system.test = test;

	context.nexl.functions.system.replaceAll = replaceAll;

	context.nexl.functions.system.isEquals = isEquals;
	context.nexl.functions.system.isContains = isContains;
	context.nexl.functions.system.not = not;

	context.nexl.functions.system.ifEquals = ifEquals;
	context.nexl.functions.system.ifContains = ifContains;

	context.nexl.functions.system.add = add;
};