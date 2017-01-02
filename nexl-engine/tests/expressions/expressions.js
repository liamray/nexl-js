var expressions = {};

// no expression test
expressions['no expression'] = {
	result: 'no expression'
};

// simple variable resolution
expressions['1[${undefinedVariable!C}] 2[${undefinedVariable2:]} 3[${undefinedVariable:111}] 4[${aaa:${bbb!C}:222}]'] = {
	result: '1[] 2[] 3[111] 4[222]'
};

// cartesian product
expressions['${intItem} ${strItem} ${boolItem} ${arr1}'] = {
	result: ['71 berry true queen', '71 berry true muscle', '71 berry true 79', '71 berry true false']
};

// undefined variable
expressions['${undefinedVariable} ${undefinedVariable!A}'] = {};

// unitedKey
expressions['${unitedKey}'] = {
	result: 'price',

	args: {
		KEY: 'disturbed'
	}
};

expressions['${unitedKey}'] = {
	result: '()',
	args: {
		KEY: '()'
	}
};

// object reverse resolution
expressions['${obj1<undefinedVariable}}'] = {};

module.exports = expressions;

// test external args override js vars
// test function call
// test standard functions call like Math.random()
// test function call when function gets a object/array and returns object/array/array of objects
// test array ob objects resolution like a.arrOfObjs.b.c
// no expression

/*
 var testExpression001 = 'no expression';

 // simple resolution
 //var testExpression002a = '${intItem}    ${strItem}    ${boolItem}    empty=[${undefinedVariable!C}]    ${intItem~O}';
 var testExpression002b = '1[${undefinedVariable!C}]    2[${undefinedVariable2:]}    3[${undefinedVariable:111}]    4[${aaa:${bbb!C}:222}]';

 // cartesian product
 var testExpression003 = '${intItem} ${strItem} ${boolItem} ${arr1}';

 // array concatenation, escaping special chars
 var testExpression004 = '${arr1?,}     ${arr1?\\?}     ${arr1?\\:}     ${arr1?\\+}     ${arr1?\\-}     ${arr1?\\!}     ${arr1?\\~}     ${arr1?\\<}     ${arr1?\\?\\:\\+\\-\\!\\~\\<}';
 var testExpression004a = '${arr3}';
 var testExpression004b = '${arr1} ${arr2}';

 // object
 var testExpression005a = '${obj1}';
 // keys and values
 var testExpression005b = 'KEYS=[${obj1~K?,}] VALUES=[${obj1~V?,}]';
 // accessing properties
 var testExpression005c = '${obj1.price}    ${..obj1....beneficial...}    ${obj1.pack~K?,}    ${obj1.pack~V?,}    ${obj1.${undefinedVariable!C}~V?,}    ${obj1.${obj1PropName}}';
 // reverse resolution
 var testExpression005d = '${obj1<true}    ${obj1<${strItem}}    ${obj1<${undefinedVariable!C}:undefined}    ';

 // omit whole expression modifier
 var testExpression006a = '${omitArr1-?,}    ${omitArr1+?,}    ${omitArr1?,}';
 var testExpression006b = '[${omitStr1-}] | ${omitStr1+} | ${omitStr1}';

 // functions
 var testExpression007a = '${reverseArray([1, 2, 3])}';
 var testExpression007b = '${obj1.pack.wrapWithBrackets("1")}';
 var testExpression007c = '${nexlEngineInternalCall()}';
 */
