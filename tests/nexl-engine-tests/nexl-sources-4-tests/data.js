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

var omitArr1 = ['disconnect', false, 24, '${undefinedVariable!C}', null];
omitStr1 = '${intItem} ${strItem} ${boolItem} ${undefinedVar!C}';

function reverseArray(arr) {
	return arr.reverse();
}

obj1.pack.wrapWithBrackets = function (str) {
	return '{' + str + '}';
};