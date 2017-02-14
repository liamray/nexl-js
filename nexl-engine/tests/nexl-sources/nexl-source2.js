/********************************************************************************************
 * data
 ********************************************************************************************/

intItem = 71;

strItem = 'berry';

var boolItem = true;

var arr1 = ['queen', 'muscle', 79, false];
var arr2 = ['air', 16, 99, true, 'smooth'];
var arr3 = ['${arr1}', '${arr2}'];
var arr4 = ['${arr3}', true, false, 'true', 79, 'queen'];
var arr5 = ['hello'];

obj1PropName = '()';

obj1 = {
	beneficial: 'mint',
	'religion': 'righteous',
	'()': 'trick',
	disturbed: 46,
	price: true,
	pack: {
		strong: 'balance',
		deer: 7
	},
	'${intItem}': '${strItem}'
};

var obj1a = {
	x: '${obj1.pack}'
};

var objArray1 = ['${obj1}', '${obj1a}'];

obj1Keys = ['balance', 7, 'mint', 'berry'];

UNITED_KEY_DEF = {
	'price': ['price', 'disturbed', 'beneficial']
};

unitedKey = '${UNITED_KEY_DEF<${KEY}@${KEY}}';

var evaluateAsUndefined1 = ['disconnect', 24, '${undefinedVariable}', null, false];
evaluateAsUndefined2 = '${intItem} ${strItem} ${boolItem} ${undefinedVar}';

function reverseArray(arr) {
	return arr.reverse();
}

var obj2 = {};
obj2.pack = {};
obj2.pack.wrapWithBrackets = function (str) {
	return '{' + str + '}';
};

function nexlEngineInternalCall() {
	return nexl.processItem('${arr1&,}');
}

function multiParamsTest(a, b, c) {
	return a.beneficial + ' ' + b[3] + ' ' + c;
}

function returnsObjectArrayFunction(param) {
	if (param === 'object') {
		return {hello: 'world'};
	}

	if (param === 'array') {
		return ['hello', 2017, 'world', true];
	}

	if (param === 'function') {
		return function () {
			return 'Okay;)';
		}
	}

	return 'Bad param !'
}

function returnsArrayOfObjects() {
	return [{hello: 1}, {hello: 2}, {hello: 3}, {hello: 4}]
}

obj3 = {
	item1: 'test',
	item2: '${undefinedVar}',
	item3: 34
};

longStr = 'The distance to the work is 155 km';
index = 32;
strForTrim = ' ' + longStr + '     ';


nexl.defaultExpression = '${test1}';
nexl.defaultArgs = {test1: 25};

keys = ['YEST'];

obj4 = {
	'${obj1}': 1
};