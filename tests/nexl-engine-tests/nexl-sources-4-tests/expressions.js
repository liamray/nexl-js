/********************************************************************************************
 * data
 ********************************************************************************************/

// importing data
'@ data.js';

/********************************************************************************************
 * variable resolutions
 ********************************************************************************************/

// no expression
var testExpression001 = 'no expression';

// simple resolution
var testExpression002 = '${intItem}    ${strItem}    ${boolItem}    empty=[${undefinedVariable!C}]    ${intItem~O}';

// cartesian product
var testExpression003 = '${intItem} ${strItem} ${boolItem} ${arr1}';

// array concatenation, escaping special chars
var testExpression004 = '${arr1?,}     ${arr1?\\?}     ${arr1?\\:}     ${arr1?\\+}     ${arr1?\\-}     ${arr1?\\!}     ${arr1?\\~}     ${arr1?\\<}     ${arr1?\\?\\:\\+\\-\\!\\~\\<}';

// object
var testExpression005 = '${obj1}';
// keys and values
var testExpression006 = 'KEYS=[${obj1~K?,}] VALUES=[${obj1~V?,}]';
// accessing properties
var testExpression007 = '${obj1.price}    ${..obj1....beneficial...}    ${obj1.pack~K?,}    ${obj1.pack~V?,}    ${obj1.${undefinedVariable!C}~V?,}    ${obj1.${obj1PropName}}';
// reverse resolution
var testExpression008 = '${obj1<true}    ${obj1<${strItem}}    ${obj1<${undefinedVariable!C}:undefined}    ';

// omit whole expression modifier