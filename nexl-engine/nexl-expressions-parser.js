/**************************************************************************************
 nexl-expressions-parser

 Copyright (c) 2016-2017 Yevgeny Sergeyev
 License : Apache 2.0

 Set of utility functions to parse nexl expressions
 **************************************************************************************/

const util = require('util');
const j79 = require('j79-utils');

var MODIFIERS = {
	'DEF_VALUE': '@',

	'CAST': ':',

	'TRANSFORMATIONS': '~', // ~K objects keys, ~V object values, ~O convert to object, ~A convert to array

	'OBJECT_REVERSE_RESOLUTION': '<',

	'ARRAY_OPERATIONS': '#', // #S #s sort; #U uniq; #C count elements
	'ELIMINATE_ARRAY_ELEMENTS': '-',
	'JOIN_ARRAY_ELEMENTS': '&',

	'STRING_OPERATIONS': '^', // ^U upper case, ^U1 capitalize first letter, ^L power case, ^LEN length, ^T trim

	'EVALUATE_AS_UNDEFINED': '!',

	'MANDATORY_VALUE': '*',

	// the following modifiers are reserved for future usage
	'RESERVED1': '?',
	'RESERVED2': '%',
	'RESERVED3': '>',
	'RESERVED4': '+'
};

var JS_PRIMITIVE_TYPES = {
	NUM: '[object Number]',
	BOOL: '[object Boolean]',
	STR: '[object String]',
	NULL: '[object Null]',
	UNDEFINED: '[object Undefined]'
};

var NEXL_TYPES = {
	'num': JS_PRIMITIVE_TYPES.NUM,
	'bool': JS_PRIMITIVE_TYPES.BOOL,
	'str': JS_PRIMITIVE_TYPES.STR,
	'null': JS_PRIMITIVE_TYPES.NULL,
	'undefined': JS_PRIMITIVE_TYPES.UNDEFINED
};

const NEXL_EXPRESSION_OPEN = '${';
const NEXL_EXPRESSION_CLOSE = '}';

const OBJECTS_SEPARATOR = '.';

const FUNCTION_CALL_OPEN = '(';
const FUNCTION_CALL_CLOSE = ')';

const ARRAY_INDEX_OPEN = '[';
const ARRAY_INDEX_CLOSE = ']';
const TWO_DOTS = '..';


const MODIFIERS_VALUES = j79.getObjectValues(MODIFIERS);
const MODIFIERS_PARSER_REGEX = makeModifiersParseRegex();
const NEXL_EXPRESSION_PARSER_REGEX = makeExpressionParserRegex();


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Parser utility functions
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function hasSubExpression(str) {
	var pos = 0;
	while (pos < str.length) {
		pos = str.indexOf(NEXL_EXPRESSION_OPEN, pos);
		if (pos < 0) {
			return false;
		}
		var escaping = escapePrecedingSlashes(str, pos);
		if (!escaping.escaped) {
			return true;
		}
		pos++;
	}

	return false;
}

function makeExpressionParserRegex() {
	var result = MODIFIERS_VALUES.concat([NEXL_EXPRESSION_OPEN, OBJECTS_SEPARATOR, FUNCTION_CALL_OPEN, ARRAY_INDEX_OPEN, NEXL_EXPRESSION_CLOSE]);
	return j79.makeOrRegexOfArray(result);
}

function makeModifiersParseRegex() {
	var result = MODIFIERS_VALUES.concat([NEXL_EXPRESSION_CLOSE]);
	return j79.makeOrRegexOfArray(result);
}

function isStartsFromZeroPos(str, chars) {
	return str.indexOf(chars) === 0;
}


// returned the following in object :
// escaped - is str escaped ? true|false
// str - corrected str if slashes were found
// correctedPos - the new position of character which was at [pos] position
function escapePrecedingSlashes(str, pos) {
	var result = {};
	var slashesCnt = 0;

	for (var i = pos - 1; i >= 0; i--) {
		if (str.charAt(i) !== '\\') {
			break;
		}

		slashesCnt++;
	}

	// odd count of slashes tells that character at [pos] position is escaped
	result.escaped = ( slashesCnt % 2 === 1 );

	var halfSlashes = Math.floor((slashesCnt + 1 ) / 2);

	if (slashesCnt > 0) {
		// cutting 1/2 slashes
		result.escapedStr = str.substr(0, pos - halfSlashes) + str.substr(pos);
	} else {
		result.escapedStr = str;
	}

	result.correctedPos = pos - halfSlashes;

	return result;
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
	if (str.charAt(pos) === ',') {
		return pos + 1;
	} else {
		return pos;
	}
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ParseModifiers
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

ParseModifiers.prototype.parseModifier = function () {
	var chars = this.str.substr(this.lastSearchPos);

	// is end of expression ?
	if (chars.length < 1 || isStartsFromZeroPos(chars, NEXL_EXPRESSION_CLOSE)) {
		this.isFinished = true;
		return;
	}

	var modifierId = this.str.charAt(this.lastSearchPos);

	this.lastSearchPos++;
	chars = chars.substr(1);

	// is end of expression ?
	if (chars.length < 1 || isStartsFromZeroPos(chars, NEXL_EXPRESSION_CLOSE)) {
		chars = '';
	}

	// parsing modifier
	var modifierMD = new ParseStr(chars, MODIFIERS_PARSER_REGEX).parse();

	var modifier = {
		id: modifierId,
		md: modifierMD
	};
	this.result.modifiers.push(modifier);

	// increasing lastSearchPos
	this.lastSearchPos += modifierMD.length;
};

ParseModifiers.prototype.parse = function () {
	// preparing result
	this.result = {};
	this.result.modifiers = [];

	this.lastSearchPos = this.pos;
	this.isFinished = false;

	while (!this.isFinished) {
		this.parseModifier();
	}

	this.result.length = this.lastSearchPos - this.pos;
	return this.result;
};


function ParseModifiers(str, pos) {
	this.str = str;
	this.pos = pos;
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
		this.result.funcCallAction.funcParams.push(nexlExpressionMD);

		// skip spaces
		this.lastSearchPos = skipSpaces(this.str, this.lastSearchPos);
		// skip comma if present
		this.lastSearchPos = skipCommaIfPresents(this.str, this.lastSearchPos);
		return;
	}

	if (isStartsFromZeroPos(charsAtPos, FUNCTION_CALL_CLOSE)) {
		this.isFinished = true;
		return;
	}

	throw util.format('Invalid nexl expression. Function arguments in nexl expression can be only another nexl expressions. Occurred in [%s] nexl expression at [%s] position', this.str, this.lastSearchPos);
};

ParseFunctionCall.prototype.parse = function () {
	// preparing result
	this.result = {};
	this.result.funcCallAction = {};
	this.result.funcCallAction.funcParams = [];

	// checking for first character in str, must be an open bracket
	if (this.str.charAt(this.pos) !== FUNCTION_CALL_OPEN) {
		throw util.format('Invalid nexl expression. Function call must start from open bracket [%s] in [%s] at [%s] position', FUNCTION_CALL_OPEN, this.str, this.pos);
	}

	this.lastSearchPos = this.pos + FUNCTION_CALL_OPEN.length;
	this.isFinished = false;

	while (!this.isFinished) {
		this.parseFunctionCallInner();
	}

	this.result.length = this.lastSearchPos - this.pos;
	return this.result;
};

function ParseFunctionCall(str, pos) {
	this.str = str;
	this.pos = pos;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ParseArrayIndexes
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

ParseArrayIndexes.prototype.parseArrayIndex = function () {
	// is primitive number ?
	for (var i = this.lastSearchPos; i < this.str.length; i++) {
		var charCode = this.str.charCodeAt(i);
		if (charCode < 48 || charCode > 57) {
			break;
		}
	}

	var primitive = this.str.substring(this.lastSearchPos, i);
	if (primitive.length > 0) {
		this.lastSearchPos += primitive.length;
		return parseInt(primitive);
	}

	var charsAtPos = this.str.substr(this.lastSearchPos);

	// is nexl expression ?
	if (isStartsFromZeroPos(charsAtPos, NEXL_EXPRESSION_OPEN)) {
		var nexlExpressionMD = new ParseNexlExpression(this.str, this.lastSearchPos).parse();
		this.lastSearchPos += nexlExpressionMD.length;
		return nexlExpressionMD;
	}

	// nothing found
	return null;
};

ParseArrayIndexes.prototype.push = function (min, max) {
	var item = {};
	item.min = min;
	item.max = max;
	this.result.arrayIndexes.arrayIndexes.push(item);
};

ParseArrayIndexes.prototype.parseArrayIndexesInner = function () {
	// skipping redundant spaces
	this.lastSearchPos = skipSpaces(this.str, this.lastSearchPos);

	// current characters are
	var charsAtPos = this.str.substr(this.lastSearchPos);

	if (isStartsFromZeroPos(charsAtPos, ARRAY_INDEX_CLOSE)) {
		this.isFinished = true;
		return;
	}

	// parsing a min range
	var min = this.parseArrayIndex();
	if (min === null) {
		throw util.format('Invalid nexl expression. Expecting for positive number or nexl expression at [%s] position in [%s]', this.lastSearchPos, this.str);
	}

	// doesn't it have two dots ?
	if (this.str.substr(this.lastSearchPos).indexOf(TWO_DOTS) !== 0) {
		this.lastSearchPos = skipSpaces(this.str, this.lastSearchPos);
		this.lastSearchPos = skipCommaIfPresents(this.str, this.lastSearchPos);
		this.push(min, min);
		return;
	}

	// skipping two dots
	this.lastSearchPos += TWO_DOTS.length;

	// parsing the max range
	var max = this.parseArrayIndex();
	if (max === null) {
		throw util.format('Invalid nexl expression. Expecting for primitive number or nexl expression at [%s] position in [%s]', this.lastSearchPos, this.str);
	}

	this.lastSearchPos = skipSpaces(this.str, this.lastSearchPos);
	this.lastSearchPos = skipCommaIfPresents(this.str, this.lastSearchPos);

	this.push(min, max);
};

ParseArrayIndexes.prototype.parse = function () {
	// preparing result
	this.result = {};
	this.result.arrayIndexes = {};
	this.result.arrayIndexes.arrayIndexes = [];

	// checking for first character in str, must be an open bracket
	if (this.str.charAt(this.pos) !== ARRAY_INDEX_OPEN) {
		throw util.format('Invalid nexl expression. Array index access must start from open bracket [%s] in [%s] at [%s] position', FUNCTION_CALL_OPEN, this.str, this.pos);
	}

	this.lastSearchPos = this.pos + ARRAY_INDEX_OPEN.length;
	this.isFinished = false;

	while (!this.isFinished) {
		this.parseArrayIndexesInner();
	}

	this.result.length = this.lastSearchPos - this.pos;
	return this.result;
};

function ParseArrayIndexes(str, pos) {
	this.str = str;
	this.pos = pos;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ParseNexlExpression
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

ParseNexlExpression.prototype.findAndEscapeIfNeededInner = function () {
	// searching for for the following characters :
	// . (new fragment), ( (function), [ (array), ${ (expression beginning), } (end of expression), all modifiers
	var pos = this.str.substr(this.searchPosTmp).search(NEXL_EXPRESSION_PARSER_REGEX);

	if (pos < 0) {
		throw util.format('Invalid nexl expression. The [%s] expression doesn\'t have a close bracket }', this.str.substr(this.pos));
	}

	this.searchPosTmp += pos;

	// escaping string if needed
	var escapedStr = escapePrecedingSlashes(this.str, this.searchPosTmp);

	// storing delta between searchPos and escapedStr.escapedStr
	this.escapingDeltaLength += (this.searchPosTmp - escapedStr.correctedPos);

	// correcting str and searchPos according to escaping
	this.str = escapedStr.escapedStr;
	this.searchPosTmp = escapedStr.correctedPos;
	this.escaped = escapedStr.escaped;

	if (this.escaped) {
		// continue searching
		this.searchPosTmp++;
	}
};

ParseNexlExpression.prototype.findAndEscapeIfNeeded = function () {
	this.searchPosTmp = this.lastSearchPos;

	do {
		this.findAndEscapeIfNeededInner();
	} while (this.escaped);

	this.searchPos = this.searchPosTmp;
};

ParseNexlExpression.prototype.cleanBuffer = function () {
	this.buffer = {};
	this.buffer.chunks = [];
	this.buffer.chunkSubstitutions = {};
};

ParseNexlExpression.prototype.dropCut2BufferIfNotEmpty = function () {
	if (this.cut.length > 0) {
		// adding to buffer
		this.buffer.chunks.push(this.cut);
	}
};

ParseNexlExpression.prototype.dropBuffer2ResultIfNotEmpty = function () {
	// is buffer contains something ?
	if (this.buffer.chunks.length > 0) {
		// adding buffer to result
		this.result.actions.push(this.buffer);
	}
};

ParseNexlExpression.prototype.dropExpression2Buffer = function (nexlExpression) {
	this.buffer.chunks.push(null);
	var index = this.buffer.chunks.length - 1;
	this.buffer.chunkSubstitutions[index] = nexlExpression;
};

ParseNexlExpression.prototype.finalizeExpression = function () {
	this.dropCut2BufferIfNotEmpty();
	this.dropBuffer2ResultIfNotEmpty();
	this.lastSearchPos = this.searchPos + 1;
	this.isFinished = true;
};

ParseNexlExpression.prototype.addObject = function () {
	this.dropCut2BufferIfNotEmpty();
	this.dropBuffer2ResultIfNotEmpty();
	this.cleanBuffer();
	this.lastSearchPos = this.searchPos + 1;
};

ParseNexlExpression.prototype.addExpression = function () {
	// parsing nexl expression
	var nexlExpressionMD = new ParseNexlExpression(this.str, this.searchPos).parse();
	// dropping existing data to buffer
	this.dropCut2BufferIfNotEmpty();
	// dropping nexl expression to buffer
	this.dropExpression2Buffer(nexlExpressionMD);

	this.lastSearchPos = this.searchPos + nexlExpressionMD.length;
};

ParseNexlExpression.prototype.addFunction = function () {
	var parsedFunctionCall = new ParseFunctionCall(this.str, this.searchPos).parse();
	this.result.actions.push(parsedFunctionCall.funcCallAction);
	this.lastSearchPos += parsedFunctionCall.length;
};

ParseNexlExpression.prototype.addArrayIndexes = function () {
	var arrayIndexes = new ParseArrayIndexes(this.str, this.searchPos).parse();
	this.result.actions.push(arrayIndexes.arrayIndexes);
	this.lastSearchPos += arrayIndexes.length;
};

ParseNexlExpression.prototype.parseModifiers = function () {
	var modifiers = new ParseModifiers(this.str, this.searchPos).parse();
	this.result.modifiers = modifiers.modifiers;
	this.lastSearchPos += modifiers.length;
};


ParseNexlExpression.prototype.parseNexlExpressionInner = function () {
	this.findAndEscapeIfNeeded();

	// characters
	var charsAtPos = this.str.substr(this.searchPos);
	// everything before searchPos and after this.searchPos
	this.cut = this.str.substring(this.lastSearchPos, this.searchPos);

	// is end of expression ?
	if (isStartsFromZeroPos(charsAtPos, NEXL_EXPRESSION_CLOSE)) {
		this.finalizeExpression();
		return;
	}

	// is new object ?
	if (isStartsFromZeroPos(charsAtPos, OBJECTS_SEPARATOR)) {
		this.addObject();
		return;
	}

	// is new expression ?
	if (isStartsFromZeroPos(charsAtPos, NEXL_EXPRESSION_OPEN)) {
		this.addExpression();
		return;
	}

	// is function call ?
	if (isStartsFromZeroPos(charsAtPos, FUNCTION_CALL_OPEN)) {
		this.addObject();
		this.addFunction();
		return;
	}

	// is array index access ?
	if (isStartsFromZeroPos(charsAtPos, ARRAY_INDEX_OPEN)) {
		this.addObject();
		this.addArrayIndexes();
		return;
	}

	// here are modifiers
	this.addObject();
	this.parseModifiers();
	this.isFinished = true;

	// validating expression integrity. it must be finished with NEXL_EXPRESSION_CLOSE
	if (this.str.charAt(this.lastSearchPos - 1) !== NEXL_EXPRESSION_CLOSE) {
		throw util.format('Invalid nexl expression. The [%s] expression doesn\'t have a close bracket }', this.str.substring(this.pos, this.lastSearchPos));
	}
};

// pos points to a $ sign
ParseNexlExpression.prototype.parse = function () {
	// the sum of all deltas between escaped and unescaped strings. for \. string delta equals to 1 because slash character will be eliminated
	this.escapingDeltaLength = 0;

	// does expression start from ${ ?
	if (this.str.indexOf(NEXL_EXPRESSION_OPEN, this.pos) !== this.pos) {
		throw util.format('Invalid nexl expression. The [%s] expression doesn\'t start from [%s] characters', this.str.substr(this.pos), NEXL_EXPRESSION_OPEN);
	}

	// skipping first ${ characters
	this.lastSearchPos = this.pos + NEXL_EXPRESSION_OPEN.length;

	// buffer is using to accumulate chunks within one object action. for example : ${x${y}z}. x, ${y} and z will be stored in buffer
	this.cleanBuffer();

	// the } character found indication
	this.isFinished = false;

	// result to be returned
	this.result = {};
	this.result.actions = []; // get object field, execute function, access array elements
	this.result.modifiers = []; // parsed nexl expression modifiers

	// iterating and parsing
	while (!this.isFinished) {
		this.parseNexlExpressionInner();
	}

	// nexl expression length in characters. need it to know where nexl expression ends
	this.result.length = this.lastSearchPos - this.pos + this.escapingDeltaLength;
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
	var escapedStr = escapePrecedingSlashes(this.str, this.searchPosTmp);

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

module.exports.MODIFIERS = MODIFIERS;

module.exports.JS_PRIMITIVE_TYPES = JS_PRIMITIVE_TYPES;
module.exports.NEXL_TYPES = NEXL_TYPES;

module.exports.hasSubExpression = hasSubExpression;

module.exports.parseStr = function (str) {
	return new ParseStr(str).parse();
};
