(function () {
	var nexlEngine = require('nexl-engine');
	var expectedResult = '';
	var nexlSource = {asFile: {fileName: 'nexl-sources-4-tests/expressions.js'}};


	function test(mustFail, expression, args) {
		return nexlEngine.evalNexlExpression(nexlSource, expression, args);
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

		// testing variable resolution failure
		// testing object reverse resolution failure
		// testing external args override js vars
		// testing function call

		compare();
	}

	start();
})();