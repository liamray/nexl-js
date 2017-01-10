/********************************************************************************************
 * data
 ********************************************************************************************/

intItem = 71;

strItem = 'berry';

var boolItem = true;

var arr1 = ['queen', 'muscle', 79, false];
var arr2 = ['air', 16, 99, true, 'smooth'];
var arr3 = ['${arr1}', '${arr2}'];

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

unitedKey = '${UNITED_KEY_DEF<${KEY}:${KEY}}';

var omitArr1 = ['disconnect', 24, '${undefinedVariable!C}', null, false];
omitStr1 = '${intItem} ${strItem} ${boolItem} ${undefinedVar!C}';

function reverseArray(arr) {
	return arr.reverse();
}

var obj2 = {};
obj2.pack = {};
obj2.pack.wrapWithBrackets = function (str) {
	return '{' + str + '}';
};

function nexlEngineInternalCall() {
	return evalNexlExpression('${arr1?,}');
}