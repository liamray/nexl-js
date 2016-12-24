(function () {
	var nexlEngine = require('nexl-engine');
	var expectedResult = '';
	var nexlSource = {asFile: {fileName: 'nexl-sources-4-tests/expressions.js'}};


	function test(mustFail, expression, args) {
		if (!mustFail) {
			return nexlEngine.evalNexlExpression(nexlSource, expression, args);
		}

		try {
			nexlEngine.evalNexlExpression(nexlSource, expression, args);
		} catch (e) {
			return;
		}

		throw 'The [' + expression + '] expression would had been fail';
	}

	function compare() {
		console.log(expectedResult);
	}

	function accumulate(prefix, result) {
		expectedResult += prefix;
		expectedResult += '=';
		expectedResult += JSON.stringify(result);
		expectedResult += '\n';
	}

	function automaticTest() {
		var jsVariables = nexlEngine.resolveJsVariables(nexlSource);

		// testing expressions which are start from [testExpression]
		for (var index in jsVariables) {
			var jsVariable = jsVariables[index];
			if (jsVariable.indexOf('testExpression') !== 0) {
				continue;
			}

			// testing
			var result = test(false, '${' + jsVariable + '}');
			// accumulating result
			accumulate(jsVariable, result);
		}
	}

	function start() {
		automaticTest();

		// attempt to resolve undefined variable
		test(true, '${undefinedVariable}}');
		test(true, '${undefinedVariable!A}');

		// testing object reverse resolution failure
		test(true, '${obj1<undefinedVariable}}');

		// testing external args override js vars
		// testing function call

		compare();
	}

	start();
})();