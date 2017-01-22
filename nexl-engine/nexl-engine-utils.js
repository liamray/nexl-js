/**************************************************************************************
 nexl-engine-utils

 Copyright (c) 2016 Yevgeny Sergeyev
 License : Apache 2.0

 Set of utility functions for nexl-engine
 **************************************************************************************/

const esprima = require('esprima');
const path = require('path');
const util = require('util');
const fs = require('fs');
const vm = require('vm');
const j79 = require('j79-utils');

var MODIFIERS = {
	"DELIMITER": "?",
	"DEF_VALUE": "@",
	"DONT_OMIT_WHOLE_EXPRESSION": "+",
	"OMIT_WHOLE_EXPRESSION": "-",
	"ABORT_ON_UNDEF_VAR": "!",
	"TREAT_AS": "~",
	"REVERSE_RESOLUTION": "<"
};

const NEXL_EXPRESSION_PARSER_REGEX = makeExpressionParserRegex();
const NEXL_EXPRESSION_OPEN = '${';
const NEXL_EXPRESSION_CLOSE = '}';

const OBJECTS_SEPARATOR = '.';

const FUNCTION_CALL_OPEN = '(';
const FUNCTION_CALL_CLOSE = ')';

const ARRAY_INDEX_OPEN = '[';
const ARRAY_INDEX_CLOSE = ']';
const TWO_DOTS = '..';

var GLOBAL_SETTINGS = {
	// is used when concatenating arrays
	DEFAULT_DELIMITER: "\n",

	// abort/not abort script execution if it's met an undefined variable
	ABORT_ON_UNDEFINED_VAR: true,

	// who is stronger the external arguments or variables in source script with the same name ?
	ARGS_ARE_OVERRIDING_SRC: true,

	// if true and has an undefined variables, the whole expression will be omitted
	SKIP_UNDEFINED_VARS: false
};

var KNOWN_BRACKETS = {
	'{': '}',
	'(': ')',
	'[': ']'
};

var MODIFIERS_ESCAPE_REGEX;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function makeExpressionParserRegex() {
	var modifiers = [];
	for (var key in MODIFIERS) {
		modifiers.push(MODIFIERS[key]);
	}

	var additionalChars = ['${', '.', '(', '[', '}'];

	var result = modifiers.concat(additionalChars);
	result = result.join('\n');
	result = escapeRegex(result);
	result = result.replace(/\n/g, ')|(').replace(/^/, '(').replace(/$/, ')');
	return result;
}


function escapeRegex(str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
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
function resolveIncludeDirectiveDom(item) {
	if (!item.expression || item.expression["type"] != "Literal") {
		return null;
	}

	var itemValue = item.expression.raw;

	if (!itemValue) {
		return null;
	}

	// regex tells : starts from quote OR single quote, @ character, one OR unlimited amount of any character, ends with the same quote which it was started
	itemValue = itemValue.match(/^('|")@\s(.+)(\1)$/);
	if (itemValue && itemValue.length === 4) {
		return itemValue[2];
	} else {
		return null;
	}
}

function assembleSourceCodeAsFile(asFile) {
	var result;
	var fileName = asFile.fileName;

	if (!fs.existsSync(fileName)) {
		throw util.format("The source  [%s], doesn't exist", fileName);
	}

	if (!fs.lstatSync(fileName).isFile()) {
		throw util.format("The  [%s] source is not a file", fileName);
	}

	try {
		result = fs.readFileSync(fileName, "UTF-8");
	} catch (e) {
		throw util.format("Failed to read [%s] source content , error : [%s]", fileName, e);
	}


	// resolving include directives
	var includeDirectives = resolveIncludeDirectives(result);

	// iterating over and processing
	for (var index in includeDirectives) {
		var includeDirective = includeDirectives[index];

		// does directive have an absolute path ?
		if (path.isAbsolute(includeDirective)) {
			result += assembleSourceCodeAsFile({"fileName": includeDirective});
			continue;
		}

		// resolve file path
		var filePath = path.dirname(fileName);

		var fullPath = path.join(filePath, includeDirective);
		result += assembleSourceCodeAsFile({"fileName": fullPath});
	}

	return result;
}

// parses javascript provided as text and resolves nexl include directives ( like "@import ../../src.js"; )
function resolveIncludeDirectives(text) {
	var result = [];

	// parse source code with esprima
	var srcParsed = esprima.parse(text);

	// iterating over and looking for include directives
	for (var key in srcParsed.body) {
		var item = srcParsed.body[key];

		// resolve include directive from dom item
		var includeDirective = resolveIncludeDirectiveDom(item);
		if (includeDirective != null) {
			result.push(includeDirective);
		}
	}

	return result;
}

function assembleSourceCodeAsText(asText) {
	var result = asText.text;

	// resolving include directives
	var includeDirectives = resolveIncludeDirectives(asText.text);

	// iterating over and processing
	for (var index in includeDirectives) {
		var includeDirective = includeDirectives[index];

		// does directive have an absolute path ?
		if (path.isAbsolute(includeDirective)) {
			result += assembleSourceCodeAsFile({"fileName": includeDirective});
			continue;
		}

		// directive has a relative path. is path4imports provided ?
		if (!asText.path4imports) {
			throw "Your source code contains an include directive(s), but you didn't provide a path";
		}

		if (!fs.existsSync(asText.path4imports)) {
			throw util.format("Path you have provided [%s] doesn't exist", asText.path4imports);
		}

		var fullPath = path.join(asText.path4imports, includeDirective);
		result += assembleSourceCodeAsFile({"fileName": fullPath});
	}

	return result;
}

function assembleSourceCode(nexlSource) {
	// validating nexlSource
	if (typeof nexlSource === 'undefined') {
		throw "nexl source is not provided";
	}

	// is both provided ?
	if (nexlSource.asText && nexlSource.asFile) {
		throw "You have to provide asText or asFile, but not both at a same time";
	}

	if (nexlSource.asText) {
		return assembleSourceCodeAsText(nexlSource.asText);
	}

	if (nexlSource.asFile) {
		return assembleSourceCodeAsFile(nexlSource.asFile);
	}

	throw "nexlSource is empty ( doesn't contain asText or asFile )";
}
module.exports.assembleSourceCode = assembleSourceCode;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function resolveVarDeclarations(varDeclaration) {
	var result = [];
	for (var i = 0; i < varDeclaration.declarations.length; i++) {
		var item = varDeclaration.declarations[i];
		result.push(item.id.name);
	}

	return result;
}

function resolveJsVariables(nexlSource) {
	var sourceCode = assembleSourceCode(nexlSource);
	var parsedCode = esprima.parse(sourceCode).body;
	var result = [];
	for (var i = 0; i < parsedCode.length; i++) {
		var item = parsedCode[i];
		if (item.type !== 'VariableDeclaration') {
			continue;
		}

		var declarations = resolveVarDeclarations(item);
		result = result.concat(declarations);
	}

	return result.sort();
}

module.exports.resolveJsVariables = resolveJsVariables;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function extractFirstLevelVarsInner(result, cycleData) {
	var c = cycleData.str.charAt(cycleData.index);

	// is it a slash character ?
	if (c === '\\') {
		// accumulating slashes
		cycleData.slashes += '\\';
		cycleData.index++;
		return;
	}

	// is not a nexl expression for sure ?
	if (c !== '$' || cycleData.str.charAt(cycleData.index + 1) !== '{') {
		// dropping slashes to result.accumulator
		cycleData.accumulator += cycleData.slashes;
		cycleData.accumulator += c;

		cycleData.slashes = '';
		cycleData.index++;
		return;
	}

	// it's a beginning of nexl expression ${... checking for precede slashes
	// is it an odd number of slashes ? ( odd number of slashes tell that $ sign is escaped )
	// example : \\\${...}  => \${...}
	if (cycleData.slashes.length % 2 === 1) {
		// dropping a half slashes to a str because it is escaping for $ sign
		cycleData.accumulator += cycleData.slashes.substr(0, cycleData.slashes.length / 2);
		cycleData.accumulator += c;

		cycleData.slashes = '';
		cycleData.index++;
		return;
	}

	// here is a nexl expression
	// dropping a half slashes to a str because it was before $ sign and they were escaped itself
	// example : \\\\\\${...}  => \\\${...}
	cycleData.accumulator += cycleData.slashes.substr(cycleData.slashes.length / 2);
	cycleData.slashes = '';
	cycleData.index++;

	// adding a new element to result.escapedChunks[]
	if (cycleData.accumulator != '') {
		result.escapedChunks.push(cycleData.accumulator);
		cycleData.currentChunk++;
	}

	// reset the cycleData.accumulator
	cycleData.accumulator = '';

	// adding a null element to result.escapedChunks[] ( it is an empty place for first level variable )
	result.escapedChunks.push(null);
	cycleData.currentChunk++;

	// calculating start/end position of nexl expression
	var endPos = findClosestBracketPos(cycleData.str, cycleData.index);

	// didn't find an end position ?
	if (endPos < 0) {
		throw util.format('The [%s] expression which starts from [%s] position doesn\'t have a close bracket', cycleData.str, cycleData.index);
	}

	// nexl expression is
	var nexlExpression = cycleData.str.substring(cycleData.index - 1, endPos + 1);
	cycleData.index += ( nexlExpression.length - 1);

	// adding nexl expression to result.flvs{}
	result.flvs[cycleData.currentChunk - 1] = nexlExpression;
}

/*
 escapes and splits the str to chunks ( as array ) where null chunks are first level variables. for example :
 str = 'To kill ${x} birds with ${y} stone';
 chunks are : [ 'To kill ', null, ' birds with ', null, ' stone' ]
 the position of every null chunk is mapped in object like this :
 {
 1: '${x}',
 3: '${y}'
 }

 function returns object :
 {
 escapedChunks: [...],
 flvs: {
 pos: '${...}',
 ...
 }
 }
 */
function extractFirstLevelVars(str) {
	var result = {
		escapedChunks: [],
		flvs: {}
	};

	var cycleData = {
		index: 0,
		slashes: '',
		str: str,
		accumulator: '',
		currentChunk: 0
	};

	// length -3 because of nexl expression must have at least 3 characters like ${}
	while (cycleData.index < cycleData.str.length - 3) {
		extractFirstLevelVarsInner(result, cycleData);
	}

	// adding slashes and the rest of the str
	cycleData.accumulator += cycleData.slashes;
	cycleData.accumulator += cycleData.str.substr(cycleData.index);

	if (cycleData.accumulator != '') {
		result.escapedChunks.push(cycleData.accumulator);
	}

	return result;
}

function hasFirstLevelVar(str) {
	var index = 0;
	while ((index = str.indexOf('${', index) ) >= 0) {
		var backIndex = index - 1;

		// searching for slashes backward
		while (backIndex >= 0 && str.charAt(backIndex) === '\\') {
			backIndex--;
		}

		// counting slashes count
		var slashesCnt = index - backIndex - 1;

		// is it an even number ? ( even number of slashes tell that nexl expression is not escaped )
		if (slashesCnt % 2 === 0) {
			// might be nexl expression. searching for close bracket
			var closeBracketPos = findClosestBracketPos(str, index + 1);
			// is close bracket found ? ( and nexl expression has something inside )
			if (closeBracketPos > 0 && closeBracketPos - index > 2) {
				return true;
			}
		}

		index++;
	}

	return false;
}

function findClosestBracketPos(str, start) {
	var openBracket = str.charAt(start);
	var closeBracket = KNOWN_BRACKETS[openBracket];
	if (!closeBracket) {
		return -1;
	}

	var slashes = '';

	var bracketCount = 1;
	for (var i = start + 1; i < str.length; i++) {
		var c = str.charAt(i);

		// accumulating slashes
		if (c === '\\') {
			slashes += '\\';
			continue;
		}

		// is open bracket and slashes count is an even number
		if (str.charAt(i) === openBracket && slashes.length % 2 === 0) {
			bracketCount++;
		}

		if (str.charAt(i) === closeBracket && slashes.length % 2 === 0) {
			bracketCount--;
		}

		slashes = '';

		if (bracketCount < 1) {
			return i;
		}
	}

	return -1;
}

function whereIsVariableEnds(str, index) {
	// nexl variable consist at least of 4 characters like ${x}
	if (str.length < index + 4) {
		throw "Invalid variable declaration. Variable length seems to short. Variable is [" + str + "]";
	}

	// checking for open bracket
	if (str.charAt(index + 1) != '{') {
		throw "Bad expression. In the [" + str + "] at the " + index + " position should be an open bracket";
	}

	var closeBracketPos = findClosestBracketPos(str, index + 1);
	if (closeBracketPos < 0) {
		throw "Variable [" + str + "] is not closed with right bracket";
	}

	return closeBracketPos;
}

module.exports.whereIsVariableEnds = whereIsVariableEnds;
module.exports.hasFirstLevelVar = hasFirstLevelVar;
module.exports.extractFirstLevelVars = extractFirstLevelVars;
module.exports.findClosestBracketPos = findClosestBracketPos;


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
		var nexlExpressionMD = new ParseNexlExpression(this.str, this.lastSearchPos).parseNexlExpression();
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
		throw util.format('Invalid nexl expression. Expecting for primitive number or nexl expression at [%s] position in [%s]', this.lastSearchPos, this.str);
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

ParseArrayIndexes.prototype.parseArrayIndexes = function () {
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


function isStartsFromZeroPos(str, chars) {
	return str.indexOf(chars) === 0;
}

ParseFunctionCall.prototype.parseFunctionCallInner = function () {
	// skipping redundant spaces
	this.lastSearchPos = skipSpaces(this.str, this.lastSearchPos);

	// current characters are
	var charsAtPos = this.str.substr(this.lastSearchPos);

	if (isStartsFromZeroPos(charsAtPos, NEXL_EXPRESSION_OPEN)) {
		var nexlExpressionMD = new ParseNexlExpression(this.str, this.lastSearchPos).parseNexlExpression();
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

	throw util.format('Invalid nexl expression. Function arguments in nexl expression can be only another nexl expression. Occurred in [%s] nexl expression at [%s] position', this.str, this.lastSearchPos);
};

ParseFunctionCall.prototype.parseFunctionCall = function () {
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

ParseNexlExpression.prototype.addObject = function () {
	this.dropCut2BufferIfNotEmpty();
	this.dropBuffer2ResultIfNotEmpty();
	this.cleanBuffer();
	this.lastSearchPos = this.searchPos + 1;
};

ParseNexlExpression.prototype.addExpression = function () {
	// parsing nexl expression
	var nexlExpressionMD = new ParseNexlExpression(this.str, this.searchPos).parseNexlExpression();
	// dropping existing data to buffer
	this.dropCut2BufferIfNotEmpty();
	// dropping nexl expression to buffer
	this.dropExpression2Buffer(nexlExpressionMD);

	this.lastSearchPos = this.searchPos + nexlExpressionMD.length;
};

ParseNexlExpression.prototype.addFunction = function () {
	var parsedFunctionCall = new ParseFunctionCall(this.str, this.searchPos).parseFunctionCall();
	this.result.actions.push(parsedFunctionCall.funcCallAction);
	this.lastSearchPos += parsedFunctionCall.length;
};

ParseNexlExpression.prototype.addArrayIndexes = function () {
	var arrayIndexes = new ParseArrayIndexes(this.str, this.searchPos).parseArrayIndexes();
	this.result.actions.push(arrayIndexes.arrayIndexes);
	this.lastSearchPos += arrayIndexes.length;
};

ParseNexlExpression.prototype.finalizeExpression = function () {
	this.dropCut2BufferIfNotEmpty();
	this.dropBuffer2ResultIfNotEmpty();
	this.lastSearchPos = this.searchPos + 1;
	this.isFinished = true;
};

ParseNexlExpression.prototype.parseModifiers = function () {

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
	this.parseModifiers();

	throw 'Something wrong in nexl expressions parser [#1]. Open me a bug !'
};

// pos points to a $ sign
ParseNexlExpression.prototype.parseNexlExpression = function () {
	// the sum of all deltas between escaped and unescaped strings. for \. string delta equals to 1 because slash character will be eliminated
	this.escapingDeltaLength = 0;

	// does expression start from ${ ?
	if (this.str.indexOf(NEXL_EXPRESSION_OPEN, this.pos) !== this.pos) {
		throw util.format('Invalid nexl expression. The [%s] expression doesn\'t start from [%s] characters', this.str.substr(this.pos), NEXL_EXPRESSION_OPEN);
	}

	// skipping first ${ characters
	this.lastSearchPos = this.pos + NEXL_EXPRESSION_OPEN.length;

	// buffer is using to accumulate chunks
	this.buffer = {
		chunks: [],
		chunkSubstitutions: {}
	};

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

	return this.result;
};

// pos points to ${ chars of expression
function ParseNexlExpression(str, pos) {
	this.str = str;
	this.pos = pos;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

ParseStr.prototype.findFirstOccurrence = function () {
	var pos1 = this.str.indexOf(NEXL_EXPRESSION_OPEN, this.lastSearchPos);
	var pos2 = this.str.indexOf(this.stopAt, this.lastSearchPos);

	if (pos1 < 0 || pos2 < 0) {
		return Math.max(pos1, pos2);
	}

	return Math.min(pos1, pos2);
};

ParseStr.prototype.dropChunk2Result = function () {
	if (this.newSearchPos - 1 > this.lastSearchPos) {
		var chunk = this.str.substring(this.lastSearchPos, this.newSearchPos);
		this.result.chunks.push(chunk);
		this.result.length += chunk.length;
	}
};

ParseStr.prototype.parseStrInner = function () {
	// this.lastSearchPos < this.str.length
	this.newSearchPos = this.findFirstOccurrence();

	// no more expressions ?
	if (this.newSearchPos < 0) {
		this.newSearchPos = this.str.length;
		this.dropChunk2Result();
		this.isFinished = true;
		return;
	}

	// Obamacare ( i.e. escaping care :P )
	var escaping = escapePrecedingSlashes(this.str, this.newSearchPos);

	// correcting str
	this.str = escaping.escapedStr;
	// correcting delta
	this.length += (escaping.correctedPos - this.newSearchPos);
	// correcting newSearchPos
	this.newSearchPos = escaping.correctedPos;

	// is escaped ?
	if (escaping.escaped) {
		// continue searching for the next occurrence
		this.lastSearchPos = this.newSearchPos + 1;
		return;
	}

	// dropping a chunk to result if its not empty
	this.dropChunk2Result();

	var chars = this.str.substr(this.newSearchPos);

	// must stop here ?
	if (isStartsFromZeroPos(chars, this.stopAt)) {
		this.isFinished = true;
		return;
	}

	// adding empty item to chunks, this item will be replaced with nexl expression's value on substitution stage
	this.result.chunks.push(null);
	var chunkNr = this.result.chunks.length - 1;

	// extracting nexl expression stuff
	var nexlExpressionMD = new ParseNexlExpression(this.str, this.newSearchPos).parseNexlExpression();

	// adding to result.chunkSubstitutions as chunkNr
	this.result.chunkSubstitutions[chunkNr] = nexlExpressionMD;

	// applying nexl expression length
	this.result.length += nexlExpressionMD.length;

	// updating lastSearchPos, lastExpressionPos
	this.lastSearchPos = this.newSearchPos + nexlExpressionMD.length;
};

ParseStr.prototype.parseStr = function () {
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

	return this.result;
};

function ParseStr(str, stopAt) {
	this.str = str;
	this.stopAt = stopAt;
}

module.exports.parseStr = function (str) {
	return new ParseStr(str).parseStr();
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var MODIFIERS_ESCAPE_REGEX;

function assembleModifiersRegex() {
	MODIFIERS_ESCAPE_REGEX = "";
	for (var key in MODIFIERS) {
		var val = MODIFIERS[key];
		val = val.replace(/(\?)|(\+)/, "\\\\$&");
		var item = "|\\\\(" + val + ")";
		MODIFIERS_ESCAPE_REGEX += item;
	}
	if (MODIFIERS_ESCAPE_REGEX.length > 0) {
		MODIFIERS_ESCAPE_REGEX = MODIFIERS_ESCAPE_REGEX.replace(/^./, "");
	}
}


function unescapeString(str) {
	var regex = new RegExp(MODIFIERS_ESCAPE_REGEX, "g");
	return str.replace(regex, "$1");
}

function unescape(item) {
	if (j79.isString(item)) {
		return unescapeString(item);
	}
	if (j79.isArray(item)) {
		for (var i = 0; i < item.length; i++) {
			item[i] = unescape(item[i]);
		}
	}
	return item;
}

module.exports.unescapeString = unescapeString;
module.exports.unescape = unescape;
assembleModifiersRegex();

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function obj2Xml(objCandidate) {
	throw '~X modifier still not implemented';
}

function isDefValueSet(value) {
	if (!value) {
		return false;
	}

	if (j79.isArray(value)) {
		if (value.length > 1) {
			return true;
		}
		if (value.length < 1) {
			return false;
		}
		return value[0] != null;
	}

	if (j79.isObject(value)) {
		for (var key in value) {
			return true;
		}
		return false;
	}

	return value != "";
}


function isVarStuffEmpty(varStuff) {
	return varStuff.value.length == 0 || ( varStuff.value.length == 1 && varStuff.value[0] == null );
}


function isModifierAt(str, index) {
	for (var modifierName in MODIFIERS) {
		var modifierChar = MODIFIERS[modifierName];
		if (j79.isUnescapedCharAt(str, modifierChar, index)) {
			return {"name": modifierName, "index": index};
		}
	}
	return null;
}

function findNexlModifier(str, fromIndex) {
	var i = fromIndex;
	while (i < str.length) {
		if (j79.isUnescapedCharAt(str, '$', i)) {
			i = whereIsVariableEnds(str, i) + 1;
			continue;
		}
		var modifier = isModifierAt(str, i);
		if (modifier != null) {
			return modifier;
		}
		i++;
	}
	return null;
}

function isModifierOn(modifier) {
	return typeof modifier !== 'undefined';
}

function pushDefValueModifier(varStuff, modifier, value) {
	if (!varStuff.MODIFIERS[modifier]) {
		varStuff.MODIFIERS[modifier] = [];
	}
	varStuff.MODIFIERS[modifier].push(value);
}

function validateAndPushModifier(varStuff, item) {
	var modifier = item.name;
	if (MODIFIERS[modifier] == MODIFIERS.DEF_VALUE) {
		pushDefValueModifier(varStuff, modifier, item.value);
		return;
	}
	if (isModifierOn(varStuff.MODIFIERS[modifier])) {
		throw "You can't use more than one [" + MODIFIERS[modifier] + "] modifier for [" + varStuff.varName + "] variable";
	}
	varStuff.MODIFIERS[modifier] = item.value;
	if (isModifierOn(varStuff.MODIFIERS.OMIT_WHOLE_EXPRESSION) && isModifierOn(varStuff.MODIFIERS.DONT_OMIT_WHOLE_EXPRESSION)) {
		throw "You can't use the [+] and [-] modifiers simultaneously for [" + varStuff.varName + "] variable";
	}
}

function addModifiers(str, varStuff) {
	var modifiers = [];
	var index = 0;
	while (index < str.length) {
		var modifier = findNexlModifier(str, index);
		if (modifier == null) {
			break;
		}
		modifiers.push(modifier);
		index = modifier.index + 1;
	}
	var dummyItem = {"index": str.length};
	modifiers.push(dummyItem);
	for (var i = 1; i < modifiers.length; i++) {
		var currentItem = modifiers[i - 1];
		var nextItem = modifiers[i];
		var item = {};
		item.name = currentItem.name;
		item.value = str.substring(currentItem.index + 1, nextItem.index);
		validateAndPushModifier(varStuff, item);
	}
}

function findFirstNexlModifierPos(nexlVar) {
	var index = 0;
	while (index < nexlVar.length) {
		if (isModifierAt(nexlVar, index)) {
			return index;
		}
		if (!j79.isUnescapedCharAt(nexlVar, '$', index)) {
			index++;
			continue;
		}
		var varEndIndex = whereIsVariableEnds(nexlVar, index);
		index = varEndIndex + 1;
	}

	return nexlVar.length;
}

function extractVarStuff(nexlVar) {
	nexlVar = nexlVar.replace(/^(\${)|}$/g, "");
	var varStuff = {};
	varStuff.MODIFIERS = {};
	var firstModifierPos = findFirstNexlModifierPos(nexlVar);
	varStuff.varName = nexlVar.substring(0, firstModifierPos);
	var modifiers = nexlVar.substr(firstModifierPos);
	addModifiers(modifiers, varStuff);
	return varStuff;
}


module.exports.isVarStuffEmpty = isVarStuffEmpty;
module.exports.isDefValueSet = isDefValueSet;
module.exports.obj2Xml = obj2Xml;
module.exports.extractVarStuff = extractVarStuff;
