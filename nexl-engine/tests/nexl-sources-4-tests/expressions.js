/********************************************************************************************
 * expressions
 ********************************************************************************************/

// importing data
'@ data.js';

/********************************************************************************************
 * variable resolutions
 ********************************************************************************************/

// no expression
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