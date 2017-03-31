/**************************************************************************************
 nexl-expressions-parser

 Copyright (c) 2016-2017 Yevgeny Sergeyev
 License : Apache 2.0
 WebSite : http://www.nexl-js.com

 Set of utility functions to parse nexl expressions
 **************************************************************************************/

const util = require('util');
const j79 = require('j79-utils');

const ACTIONS = {
	'PROPERTY_RESOLUTION': '.',
	'ARRAY_INDEX': '[', // elements access example : [^], [$], [3], [-3], [2..6, 3..9], [^..$], [^..3], [3..$], [^..-3], [-3..$], [^..1, 4..${x}, -3..$]
	'FUNCTION_CALL': '(',
	'DEF_VALUE': '@',
	'CAST': ':',
	'OBJECT_OPERATIONS': '~', // ~K objects keys, ~V object values, ~O convert to object, ~X produce XML, ~P produce key value pairs, ~Y produce YAML, ~Z make undefined for empty object
	'ARRAY_OPERATIONS': '#', // #S #s sort; #U uniq; #D; #LEN array length, #A convert to array, #Z make undefined for empty array, #F resolve first element if array has only 1 element, otherwise make it undefined
	'OBJECT_KEY_REVERSE_RESOLUTION': '<',
	'JOIN_ARRAY_ELEMENTS': '&',
	'ELIMINATE': '-',
	'APPEND_MERGE': '+',
	'STRING_OPERATIONS': '^', // ^U upper case, ^U1 capitalize first letter, ^L power case, ^LEN length, ^T trim, ^Z make undefined for empty string
	'UNDEFINED_VALUE_OPERATIONS': '!',
	'MANDATORY_VALUE_VALIDATOR': '*',
	'PUSH_FUNCTION_PARAM': '|',

	// the following actions are reserved for future usage
	'RESERVED2': '%',
	'RESERVED3': '>',
	'RESERVED4': '=',
	'RESERVED5': '?'
};

const JS_PRIMITIVE_TYPES = {
	NUM: '[object Number]',
	BOOL: '[object Boolean]',
	STR: '[object String]',
	NULL: '[object Null]',
	UNDEFINED: '[object Undefined]'
};

const NEXL_TYPES = {
	'num': JS_PRIMITIVE_TYPES.NUM,
	'bool': JS_PRIMITIVE_TYPES.BOOL,
	'str': JS_PRIMITIVE_TYPES.STR,
	'null': JS_PRIMITIVE_TYPES.NULL,
	'undefined': JS_PRIMITIVE_TYPES.UNDEFINED
};

const OBJECT_OPERATIONS_OPTIONS = {
	'RESOLVE_KEYS': 'K',
	'RESOLVE_VALUES': 'V',
	'CONVERT_TO_OBJECT': 'O',
	'PRODUCE_XML': 'X',
	'PRODUCE_YAML': 'Y',
	'PRODUCE_KEY_VALUE_PAIRS': 'P'
};

const ARRAY_OPERATIONS_OPTIONS = {
	'SORT_ASC': 'S',
	'SORT_DESC': 's',
	'UNIQUE': 'U',
	'DUPLICATES': 'D',
	'LENGTH': 'LEN',
	'CONVERT_TO_ARRAY': 'A',
	'GET_FIRST_OR_NOTHING': 'F'
};

const STRING_OPERATIONS_OPTIONS = {
	'UPPERCASE': 'U',
	'CAPITALIZE_FIRST_LETTER': 'U1',
	'LOWERCASE': 'L',
	'TRIM': 'T',
	'LENGTH': 'LEN'
};

const UNDEFINED_VALUE_OPERATIONS_OPTIONS = {
	'EVALUATE_TO_UNDEFINED': 'U',
	'MAKE_EMPTY_ITEMS_UNDEFINED': 'E'
};

const ACTION_POSSIBLE_VALUES = {
	':': Object.keys(NEXL_TYPES),
	'~': j79.getObjectValues(OBJECT_OPERATIONS_OPTIONS),
	'#': j79.getObjectValues(ARRAY_OPERATIONS_OPTIONS),
	'^': j79.getObjectValues(STRING_OPERATIONS_OPTIONS),
	'!': j79.getObjectValues(UNDEFINED_VALUE_OPERATIONS_OPTIONS),
	'?': ['']
};

const ARRAY_INDEX_CLOSE = ']';
const FUNCTION_CLOSE = ')';


const NEXL_EXPRESSION_OPEN = '${';
const NEXL_EXPRESSION_CLOSE = '}';

const ARRAY_FIRST_ITEM = '^';
const ARRAY_LAST_ITEM = '$';

const TWO_DOTS = '..';
const COMMA = ',';


const ACTION_VALUES = j79.getObjectValues(ACTIONS);
const ACTIONS_REGEX = makeActionsRegex();


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Parser utility functions
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function makeActionsRegex() {
	var result = ACTION_VALUES.concat([NEXL_EXPRESSION_CLOSE]);
	return j79.makeOrRegexOfArray(result);
}

function isStartsFromZeroPos(str, chars) {
	return str.indexOf(chars) === 0;
}

function skipSpaces(str, pos) {
	for (var i = pos; i < str.length; i++) {
		if (str.charAt(i) !== ' ') {
			return i;
		}
	}

	return str.length;
}

function skipCommaIfPresents(str, pos) {
	if (str.charAt(pos) === COMMA) {
		return pos + 1;
	} else {
		return pos;
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ParseFunctionCall
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

ParseFunctionCall.prototype.parseFunctionCallInner = function () {
	// skipping redundant spaces
	this.lastSearchPos = skipSpaces(this.str, this.lastSearchPos);

	// current characters are
	var charsAtPos = this.str.substr(this.lastSearchPos);

	if (isStartsFromZeroPos(charsAtPos, NEXL_EXPRESSION_OPEN)) {
		var nexlExpressionMD = new ParseNexlExpression(this.str, this.lastSearchPos).parse();
		this.lastSearchPos += nexlExpressionMD.length;
		this.result.funcParams.push(nexlExpressionMD);

		// skip spaces
		this.lastSearchPos = skipSpaces(this.str, this.lastSearchPos);
		// skip comma if present
		this.lastSearchPos = skipCommaIfPresents(this.str, this.lastSearchPos);
		return;
	}

	if (isStartsFromZeroPos(charsAtPos, FUNCTION_CLOSE)) {
		this.isFinished = true;
		return;
	}

	throw util.format('Invalid nexl expression. Function arguments in nexl expression can be only another nexl expressions. Occurred in [%s] nexl expression at [%s] position', this.str, this.lastSearchPos);
};

ParseFunctionCall.prototype.parse = function () {
	// preparing result
	this.result = {};
	this.result.funcParams = [];

	this.lastSearchPos = this.pos;
	this.isFinished = false;

	while (!this.isFinished) {
		this.parseFunctionCallInner();
	}

	this.result.length = this.lastSearchPos - this.pos + 1;
	return this.result;
};

function ParseFunctionCall(str, pos) {
	this.str = str;
	this.pos = pos;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ParseArrayIndexes
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

ParseArrayIndexes.prototype.parseIntAndValidate = function (str) {
	var result = parseInt(str);
	// NaN check
	if (result !== result) {
		throw util.format('Failed to parse [%s] array index at [%s] position in [%s]', str, this.lastSearchPos, this.str);
	}

	return result;
};

ParseArrayIndexes.prototype.parseArrayIndex = function () {
	var charsAtPos = this.str.substr(this.lastSearchPos);

	// is primitive number ?
	var primitive = charsAtPos.match(/^[-]?[0-9]+/);
	if (primitive !== null && primitive.length === 1) {
		primitive = primitive[0];
		var number = parseInt(primitive);
		this.lastSearchPos += primitive.length;
		return number;
	}

	// is nexl expression ?
	if (isStartsFromZeroPos(charsAtPos, NEXL_EXPRESSION_OPEN)) {
		var nexlExpressionMD = new ParseNexlExpression(this.str, this.lastSearchPos).parse();
		this.lastSearchPos += nexlExpressionMD.length;
		return nexlExpressionMD;
	}

	// is ARRAY_FIRST_ITEM/ARRAY_LAST_ITEM
	var char = charsAtPos.charAt(0);
	if (char === ARRAY_FIRST_ITEM || char === ARRAY_LAST_ITEM) {
		this.lastSearchPos++;
		return char;
	}

	// nothing found
	return null;
};

ParseArrayIndexes.prototype.push = function (min, max) {
	var item = {};
	item.min = min;
	item.max = max;
	this.result.arrayIndexes.push(item);
};

ParseArrayIndexes.prototype.resolveIndexes = function () {
	var min = this.parseArrayIndex();
	if (min === null) {
		return;
	}

	var max = min;

	// continuing parsing, does it contain two dots ?
	if (this.str.substr(this.lastSearchPos).indexOf(TWO_DOTS) === 0) {
		// skipping two dots
		this.lastSearchPos += TWO_DOTS.length;

		// retrieving the max element
		max = this.parseArrayIndex();
		if (max === null) {
			throw util.format('Bad array index. Expecting for an integer number, %s, %s or nexl expression at [%s] position in [%s]', ARRAY_FIRST_ITEM, ARRAY_LAST_ITEM, this.lastSearchPos, this.str);
		}
	}

	// adding
	this.push(min, max);
};

ParseArrayIndexes.prototype.parseArrayIndexesInner = function () {
	// skipping redundant spaces
	this.lastSearchPos = skipSpaces(this.str, this.lastSearchPos);

	// parsing indexes
	this.resolveIndexes();

	// skipping spaces
	this.lastSearchPos = skipSpaces(this.str, this.lastSearchPos);

	// current characters are
	var charsAtPos = this.str.charAt(this.lastSearchPos);

	if (charsAtPos === ',') {
		this.lastSearchPos++;
		return;
	}

	if (charsAtPos === ARRAY_INDEX_CLOSE) {
		this.isFinished = true;
		return;
	}

	throw util.format('Invalid nexl expression. Expecting %s or %s at [%s] position in [%s] expression, but found a %s character', COMMA, ARRAY_INDEX_CLOSE, this.lastSearchPos, this.str, charsAtPos);
};

ParseArrayIndexes.prototype.parse = function () {
	// preparing result
	this.result = {};
	this.result.arrayIndexes = [];

	this.lastSearchPos = this.pos;
	this.isFinished = false;

	while (!this.isFinished) {
		this.parseArrayIndexesInner();
	}

	this.result.length = this.lastSearchPos - this.pos + 1;
	return this.result;
};

function ParseArrayIndexes(str, pos) {
	this.str = str;
	this.pos = pos;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ParseNexlExpression
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

ParseNexlExpression.prototype.createAndAddAction = function (actionValue) {
	var action = {};
	action.actionId = this.currentAction;
	action.actionValue = actionValue;

	this.result.actions.push(action);
};

ParseNexlExpression.prototype.resolveNextAction = function () {
	this.currentAction = this.str.charAt(this.lastSearchPos);
	if (this.currentAction.search(ACTIONS_REGEX) != 0) {
		throw util.format('Invalid nexl expression. The [%s] nexl expression should be probably closed with } bracket at [%s] position', this.str, this.lastSearchPos);
	}

	this.lastSearchPos += this.currentAction.length;
};

ParseNexlExpression.prototype.createArrOrFuncAction = function (data, length) {
	// creating and adding action
	this.createAndAddAction(data);

	// moving forward a lastSearchPos
	this.lastSearchPos += length;

	// resolving next action
	this.resolveNextAction();
};

ParseNexlExpression.prototype.resolveActionStaticValue = function (parsed) {
	// validating static value. it must not contain chunks for substitute
	if (parsed.chunks.length === 1 && j79.isString(parsed.chunks[0])) {
		return parsed.chunks[0];
	}

	throw util.format('The [%s] action cannot contain internal expressions at [%s] position in [%s] expression. It must be a plain string', this.currentAction, this.lastSearchPos, this.str);
};

ParseNexlExpression.prototype.addChunkedAction = function (parsed) {
	// skip empty chunks for property resolution action
	if (this.currentAction === ACTIONS.PROPERTY_RESOLUTION && parsed.chunks.length === 1 && parsed.chunks[0] === '') {
		return;
	}

	this.createAndAddAction(parsed);
};

ParseNexlExpression.prototype.throwBadValueException = function (actionValue, expectedValue) {
	var expected;
	var real;

	if (expectedValue.length === 1 && expectedValue[0] === '') {
		expected = 'an empty value';
	} else {
		expected = util.format('one of the following values [%s]', expectedValue.join(','));
	}

	if (actionValue === '') {
		real = 'en empty';
	} else {
		real = util.format('a [%s]', actionValue)
	}

	throw util.format('The [%s] action in [%s] expression must have %s, but has %s value', this.currentAction, this.str, expected, real);
};

// parsed contains chunks and chunksSubstitutions
ParseNexlExpression.prototype.validateAndSetActionValue = function (parsed) {
	// resolving must have value
	var expectedValue = ACTION_POSSIBLE_VALUES[this.currentAction];

	// should expectedValue be validated ? ( for example : ~Q where Q is inappropriate value )
	if (expectedValue === undefined) {
		this.addChunkedAction(parsed);
		return;
	}

	// resolving static value
	var actionValue = this.resolveActionStaticValue(parsed);

	// validating
	if (expectedValue.indexOf(actionValue) < 0) {
		this.throwBadValueException(actionValue, expectedValue);
	}

	this.createAndAddAction(actionValue);
};

ParseNexlExpression.prototype.parseNexlExpressionInner = function () {
	// at this point this.lastSearchPos points to the character next to current action
	// for example in .test it points to t character

	var parsed;

	// is end of expression ?
	if (this.currentAction === NEXL_EXPRESSION_CLOSE) {
		this.isFinished = true;
		return;
	}

	// is function ?
	if (this.currentAction === ACTIONS.FUNCTION_CALL) {
		// returns : length, funcParams
		parsed = new ParseFunctionCall(this.str, this.lastSearchPos).parse();
		this.createArrOrFuncAction(parsed.funcParams, parsed.length);
		return;
	}

	// is array indexes ?
	if (this.currentAction === ACTIONS.ARRAY_INDEX) {
		// returns : length, arrayIndexes
		parsed = new ParseArrayIndexes(this.str, this.lastSearchPos).parse();
		this.createArrOrFuncAction(parsed.arrayIndexes, parsed.length);
		return;
	}

	// it's special action which doesn't have ACTION_VALUE and this action resets this.result chain
	if (this.currentAction === ACTIONS.PUSH_FUNCTION_PARAM) {
		this.createAndAddAction();
		this.currentAction = ACTIONS.PROPERTY_RESOLUTION;
	}

	// all other actions are strings
	var chars = this.str.substr(this.lastSearchPos);

	// returns chunks, chunkSubstitutions, length
	parsed = new ParseStr(chars, ACTIONS_REGEX).parse();

	// validating action value and setting it up
	this.validateAndSetActionValue(parsed);

	// moving forward a lastSearchPos
	this.lastSearchPos += parsed.length;

	// resolving next action
	this.resolveNextAction();
};

// pos points to a $ sign
ParseNexlExpression.prototype.parse = function () {
	// does expression start from ${ ?
	if (this.str.indexOf(NEXL_EXPRESSION_OPEN, this.pos) !== this.pos) {
		throw util.format('Invalid nexl expression. The [%s] expression doesn\'t start from [%s] characters', this.str.substr(this.pos), NEXL_EXPRESSION_OPEN);
	}

	// skipping first ${ characters
	this.lastSearchPos = this.pos + NEXL_EXPRESSION_OPEN.length;

	// the } character is indication
	this.isFinished = false;

	// result to be returned
	this.result = {};
	this.result.actions = [];

	this.currentAction = ACTIONS.PROPERTY_RESOLUTION;

	// iterating and parsing
	while (!this.isFinished) {
		this.parseNexlExpressionInner();
	}

	// nexl expression length in characters. need it to know where nexl expression ends
	this.result.length = this.lastSearchPos - this.pos;
	this.result.str = this.str.substr(this.pos, this.result.length);

	return this.result;
};

// pos points to ${ chars of expression
function ParseNexlExpression(str, pos) {
	this.str = str;
	this.pos = pos || 0;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ParseStr
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

ParseStr.prototype.dropChunk2Result = function (untilPos) {
	if (untilPos > this.lastSearchPos) {
		var chunk = this.str.substring(this.lastSearchPos, untilPos);
		this.result.chunks.push(chunk);
		this.result.length += chunk.length;
	}
};

ParseStr.prototype.findAndEscapeIfNeededInner = function () {
	var chars = this.str.substr(this.searchPosTmp);

	// searching for for the following characters : NEXL_EXPRESSION_OPEN
	var pos1 = chars.indexOf(NEXL_EXPRESSION_OPEN);
	// searching for this.stopAt
	var pos2 = !this.stopAt ? -1 : chars.search(this.stopAt);

	// calculating who is nearest among pos1 & pos2
	var pos;
	if (pos1 < 0 || pos2 < 0) {
		pos = Math.max(pos1, pos2);
	} else {
		pos = Math.min(pos1, pos2);
	}

	// nothing found ?
	if (pos < 0) {
		this.searchPosTmp = -1;
		return false;
	}

	this.searchPosTmp += pos;

	// escaping string if needed
	var escapedStr = j79.escapePrecedingSlashes(this.str, this.searchPosTmp);

	// storing delta between searchPos and escapedStr.escapedStr
	this.result.length += (this.searchPosTmp - escapedStr.correctedPos);

	// correcting str and searchPos according to escaping
	this.str = escapedStr.escapedStr;
	this.searchPosTmp = escapedStr.correctedPos;

	if (escapedStr.escaped) {
		// continue searching
		this.searchPosTmp++;
		return true;
	} else {
		return false;
	}
};


ParseStr.prototype.findAndEscapeIfNeeded = function () {
	this.searchPosTmp = this.lastSearchPos;

	while (this.findAndEscapeIfNeededInner()) {
	}

	this.newSearchPos = this.searchPosTmp;
};


ParseStr.prototype.parseStrInner = function () {
	this.findAndEscapeIfNeeded();

	// no more expressions ?
	if (this.newSearchPos < 0) {
		this.dropChunk2Result(this.str.length);
		this.isFinished = true;
		return;
	}

	// dropping a chunk to result if its not empty
	this.dropChunk2Result(this.newSearchPos);

	var chars = this.str.substr(this.newSearchPos);

	// must stop here ?
	if (this.stopAt && chars.search(this.stopAt) === 0) {
		this.isFinished = true;
		return;
	}

	// adding empty item to chunks, this item will be replaced with nexl expression's value on substitution stage
	this.result.chunks.push(null);
	var chunkNr = this.result.chunks.length - 1;

	// extracting nexl expression stuff
	var nexlExpressionMD = new ParseNexlExpression(this.str, this.newSearchPos).parse();

	// adding to result.chunkSubstitutions as chunkNr
	this.result.chunkSubstitutions[chunkNr] = nexlExpressionMD;

	// applying nexl expression length
	this.result.length += nexlExpressionMD.length;

	// updating lastSearchPos, lastExpressionPos
	this.lastSearchPos = this.newSearchPos + nexlExpressionMD.length;
};

ParseStr.prototype.parse = function () {
	this.result = {};
	this.result.chunks = [];
	this.result.chunkSubstitutions = {}; // map of position:nexl-expr-definition
	this.result.length = 0;

	// last search position in str
	this.lastSearchPos = 0;

	this.isFinished = false;


	while (!this.isFinished) {
		this.parseStrInner();
	}

	this.result.str = this.str.substr(0, this.result.length);

	// adding empty chunk for empty string, otherwise it will be substituted as null
	if (this.result.str.length < 1) {
		this.result.chunks.push('');
	}

	return this.result;
};

function ParseStr(str, stopAt) {
	this.str = str;
	this.stopAt = stopAt;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// exports
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.JS_PRIMITIVE_TYPES = JS_PRIMITIVE_TYPES;
module.exports.NEXL_TYPES = NEXL_TYPES;
module.exports.OBJECT_OPERATIONS_OPTIONS = OBJECT_OPERATIONS_OPTIONS;
module.exports.ARRAY_OPERATIONS_OPTIONS = ARRAY_OPERATIONS_OPTIONS;
module.exports.STRING_OPERATIONS_OPTIONS = STRING_OPERATIONS_OPTIONS;
module.exports.UNDEFINED_VALUE_OPERATIONS_OPTIONS = UNDEFINED_VALUE_OPERATIONS_OPTIONS;
module.exports.ACTIONS = ACTIONS;

module.exports.ARRAY_FIRST_ITEM = ARRAY_FIRST_ITEM;
module.exports.ARRAY_LAST_ITEM = ARRAY_LAST_ITEM;

module.exports.parseStr = function (str) {
	return new ParseStr(str).parse();
};
