// libraries
const nexlEngine = require('../nexl-engine');
const util = require('util');
const j79 = require('j79-utils');
const assert = require('assert');
const expressions = require('./expressions/expressions');

// nexl source file
var nexlSource = {asFile: {fileName: 'nexl-sources/nexl-source1.js'}};

// comparing two javascript variables
function compare(result, expectedResult) {
	// todo: temporary, until the big nexl-engine refactoring
	expectedResult = j79.wrapWithArrayIfNeeded(expectedResult);

	var s1 = JSON.stringify(result);
	var s2 = JSON.stringify(expectedResult);
	return s1 === s2;
}

// exprDef -> to string
function exprDefVerbally(exprDef) {
	return util.format("expression = [%s], args = %s", exprDef.expression, JSON.stringify(exprDef.args))
}

// prints OK message for expression
function printOkExpression(exprDef) {
	console.log('OK for ', exprDefVerbally(exprDef));
}

// tests the expression
function testExpression(exprDef) {
	try {
		var result = nexlEngine.evalNexlExpression(nexlSource, exprDef.expression, exprDef.args);
	} catch (e) {
		if (exprDef.result !== undefined) {
			throw util.format('Test failed for %s. Reason : ', exprDefVerbally(exprDef), e);
		}

		printOkExpression(exprDef);
		return;
	}

	// if the exprDef.result is not defined, expression must fail. checking
	if (exprDef.result === undefined) {
		throw util.format("As for %s must FAIL, but hasn't", exprDefVerbally(exprDef));
	}

	assert(compare(result, exprDef.result), util.format("Expected result = [%s] doesn't match to original result = [%s] for %s", exprDef.result, result, exprDefVerbally(exprDef)));
	printOkExpression(exprDef);
}

// entry point
function start() {
	// iterating over expressions definitions
	for (var index in expressions) {
		var exprDef = expressions[index];
		testExpression(exprDef);
	}

	console.log('\n\n****************************************************************\nAll tests are passed OK\n****************************************************************');
}

start();