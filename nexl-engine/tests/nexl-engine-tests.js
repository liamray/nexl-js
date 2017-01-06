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

function failureMessage(exprDef, err) {
	console.log('\n------>>>>>> FAILURE !!!! <<<<<<------');
	console.log(exprDefVerbally(exprDef));
	console.log('Reason : ' + err);
	console.log('');
}

// tests the expression
function testExpression(exprDef) {
	try {
		var result = nexlEngine.evalNexlExpression(nexlSource, exprDef.expression, exprDef.args);
	} catch (e) {
		if (exprDef.result !== undefined) {
			failureMessage(exprDef, e);
			return false;
		}

		printOkExpression(exprDef);
		return true;
	}

	// if the exprDef.result is not defined, expression must fail. checking
	if (exprDef.result === undefined) {
		failureMessage(exprDef, 'This test MUST FAIL, but hasn\'t');
		return false;
	}

	var compareResult = compare(result, exprDef.result);
	if (!compareResult) {
		failureMessage(exprDef, util.format('Expected result = [%s] doesn\'t match to evaluated result = [%s]', exprDef.result, result));
		return false;
	}

	printOkExpression(exprDef);
	return true;
}

// entry point
function start() {
	// iterating over expressions definitions
	var okCnt = 0;
	var failCnt = 0;
	for (var index in expressions) {
		var exprDef = expressions[index];
		var result = testExpression(exprDef);

		if (result) {
			okCnt++;
		} else {
			failCnt++;
		}
	}

	util.log('OK tests : %s', okCnt);
	util.log('Failed tests : %s', failCnt);

	var msg = failCnt <= 0 ? 'All tests are passed OK' : 'One or more tests ARE FAILED !!!';
	util.log('\n\n****************************************************************\n%s\n****************************************************************', msg);
}

start();
