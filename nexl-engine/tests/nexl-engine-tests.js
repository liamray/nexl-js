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

// prints OK message for expression
function printOkExpression(expression) {
	console.log(util.format("OK for [%s] expression", expression));
}

// tests the expression
function testExpression(expression, exprDef) {
	try {
		var result = nexlEngine.evalNexlExpression(nexlSource, expression, exprDef.args);
	} catch (e) {
		if (exprDef.result) {
			throw util.format("The [%s] expression is failed. Reason : [%s]", expression, e);
		}

		printOkExpression(expression);
		return;
	}

	// if the exprDef.result is not defined, expression must fail. checking
	if (!exprDef.result) {
		throw util.format("The [%s] expression must fail, but hasn't", expression);
	}

	assert(compare(result, exprDef.result), util.format("Evaluation result = [%s] doesn't match to expected = [%s] for [%s] expression, ", result, exprDef.result, expression));
	printOkExpression(expression);
}

// entry point
function start() {
	// iterating over expressions
	for (var expression in expressions) {
		var exprDef = expressions[expression];
		testExpression(expression, exprDef);
	}
}

start();