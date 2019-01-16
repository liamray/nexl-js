const assert = require('assert');

const testAPI = require('../test-api');
const confConsts = require('../../backend/common/conf-constants');
const confMgmt = require('../../backend/api/conf-mgmt');
const storageUtils = require('../../backend/api/storage-utils');
const di = require('../../backend/common/data-interchange-constants');
const deepEqual = require('deep-equal');

// --------------------------------------------------------------------------------

function init(predefinedNexlJSFIlesDir, tmpNexlJSFilesDir) {
	confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.STORAGE_DIR] = predefinedNexlJSFIlesDir;

	return Promise.resolve();
}

function makeData(relativePath, text, matchCase, isRegex) {
	const data = {};
	data[di.RELATIVE_PATH] = relativePath;
	data[di.TEXT] = text;
	data[di.MATCH_CASE] = matchCase;
	data[di.IS_REGEX] = isRegex;
	return data;
}

const tests = [
	// 0
	{
		data: makeData('/', 'hello', false, true),
		result: {
			"\\expressions-test\\file2.js": [
				{
					"line": "var arr5 = ['hello'];",
					"number": 15
				},
				{
					"line": "var arr7 = ['hello', undefined, null, undefined, 21, true, 'test'];",
					"number": 17
				},
				{
					"line": "\t\treturn {hello: 'world'};",
					"number": 74
				},
				{
					"line": "\t\treturn ['hello', 2017, 'world', true];",
					"number": 78
				},
				{
					"line": "\treturn [{hello: 1}, {hello: 2}, {hello: 3}, {hello: 4}]",
					"number": 91
				},
				{
					"line": "\tb: ['${_this_.a}', 11, 'hello']",
					"number": 218
				},
				{
					"line": "\t\tAustralia: 'hello'",
					"number": 307
				},
				{
					"line": "undefArr = ['hello', '${intItem}', '${undefinedVar!U} hello', undefined];",
					"number": 313
				}
			]
		}
	},

	// 1
	{
		data: makeData('\\', 'hello', false, true),
		result: {
			"\\expressions-test\\file2.js": [
				{
					"line": "var arr5 = ['hello'];",
					"number": 15
				},
				{
					"line": "var arr7 = ['hello', undefined, null, undefined, 21, true, 'test'];",
					"number": 17
				},
				{
					"line": "\t\treturn {hello: 'world'};",
					"number": 74
				},
				{
					"line": "\t\treturn ['hello', 2017, 'world', true];",
					"number": 78
				},
				{
					"line": "\treturn [{hello: 1}, {hello: 2}, {hello: 3}, {hello: 4}]",
					"number": 91
				},
				{
					"line": "\tb: ['${_this_.a}', 11, 'hello']",
					"number": 218
				},
				{
					"line": "\t\tAustralia: 'hello'",
					"number": 307
				},
				{
					"line": "undefArr = ['hello', '${intItem}', '${undefinedVar!U} hello', undefined];",
					"number": 313
				}
			]
		}
	},

	// 2
	{
		data: makeData('\\', 'hello', false, false),
		result: {
			"\\expressions-test\\file2.js": [
				{
					"line": "var arr5 = ['hello'];",
					"number": 15
				},
				{
					"line": "var arr7 = ['hello', undefined, null, undefined, 21, true, 'test'];",
					"number": 17
				},
				{
					"line": "\t\treturn {hello: 'world'};",
					"number": 74
				},
				{
					"line": "\t\treturn ['hello', 2017, 'world', true];",
					"number": 78
				},
				{
					"line": "\treturn [{hello: 1}, {hello: 2}, {hello: 3}, {hello: 4}]",
					"number": 91
				},
				{
					"line": "\tb: ['${_this_.a}', 11, 'hello']",
					"number": 218
				},
				{
					"line": "\t\tAustralia: 'hello'",
					"number": 307
				},
				{
					"line": "undefArr = ['hello', '${intItem}', '${undefinedVar!U} hello', undefined];",
					"number": 313
				}
			]
		}
	},

	// 3
	{
		data: makeData('/', 'hello', false, false),
		result: {
			"\\expressions-test\\file2.js": [
				{
					"line": "var arr5 = ['hello'];",
					"number": 15
				},
				{
					"line": "var arr7 = ['hello', undefined, null, undefined, 21, true, 'test'];",
					"number": 17
				},
				{
					"line": "\t\treturn {hello: 'world'};",
					"number": 74
				},
				{
					"line": "\t\treturn ['hello', 2017, 'world', true];",
					"number": 78
				},
				{
					"line": "\treturn [{hello: 1}, {hello: 2}, {hello: 3}, {hello: 4}]",
					"number": 91
				},
				{
					"line": "\tb: ['${_this_.a}', 11, 'hello']",
					"number": 218
				},
				{
					"line": "\t\tAustralia: 'hello'",
					"number": 307
				},
				{
					"line": "undefArr = ['hello', '${intItem}', '${undefinedVar!U} hello', undefined];",
					"number": 313
				}
			]
		}
	},

	// 4
	{
		data: makeData('\\', 'a.*z', false, true),
		result: {
			"\\expressions-test\\file1.js": [
				{
					"line": "\t\"DEV\": ['zombie', 'arrows', 'zebra'],",
					"number": 48
				},
				{
					"line": "\t\tvar hosts = nexl.nexlize('http://${HOSTS.APP_SERVER_INTERFACES.' + escapeDrpProd(key) + '~V}');",
					"number": 137
				}
			]
		}
	},

	// 5
	{
		data: makeData('jenkins', 'hello', false, false),
		result: {}
	},

	// 6
	{
		data: makeData('jenkins', 'var.*IN', true, true),
		result: {}
	},

	// 7
	{
		data: makeData('jenkins', 'var.*IN', false, true),
		result: {
			"\\jenkins\\jenkins.js": [
				{
					"line": "\tfor (var key in obj) {",
					"number": 19
				}
			]
		}
	},

	// 8
	{
		data: makeData('jenkins', 'var.*IN', true, false),
		result: {}
	},

	// 9
	{
		data: makeData('jenkins', 'var.*IN', false, false),
		result: {}
	},

	// 10
	{
		data: makeData('/jenkins', 'ARTIFACTS', false, false),
		result: {
			"\\jenkins\\jenkins.js": [
				{
					"line": "\tARTIFACTS: {",
					"number": 41
				},
				{
					"line": "\tBRANCH_CHOICES: '${DEF_CHOICE#A+${_this_.ARTIFACTS~K}&\\n}',",
					"number": 57
				}
			]
		}
	},

	// 11
	{
		data: makeData('/jenkins\\', 'ARTIFACTS', false, false),
		result: {
			"\\jenkins\\jenkins.js": [
				{
					"line": "\tARTIFACTS: {",
					"number": 41
				},
				{
					"line": "\tBRANCH_CHOICES: '${DEF_CHOICE#A+${_this_.ARTIFACTS~K}&\\n}',",
					"number": 57
				}
			]
		}
	},

	// 12
	{
		data: makeData('/a/b\\c//', '0.3906744021443209', false, false),
		result: {
			"\\a\\b\\c\\d.js": [
				{
					"line": "randomNumber = 0.3906744021443209;",
					"number": 1
				}
			]
		}
	},

	// 13
	{
		data: makeData('/a/b\\c//', 'Slacklining is cool !!!', false, false),
		result: {
			"\\a\\b\\c\\d.js": [
				{
					"line": "randomSentence = 'Slacklining is cool !!!';",
					"number": 2
				}
			]
		}
	},

	// 14
	{
		data: makeData('/a/b\\c//d.js', 'Slacklining is cool !!!', false, false),
		result: {}
	}

];


function run() {
	return storageUtils.gatherAllFiles('/').then(_ => {
		const promises = [];
		tests.forEach(test => {
			promises.push(storageUtils.findInFiles(test.data).then(result => {
				return {
					isOK: deepEqual(result, test.result),
					test: test,
					result: result
				};
			}));
		});

		return Promise.all(promises).then(result => {
			for (let index = 0; index < result.length; index++) {
				if (!result[index].isOK) {
					return Promise.reject(result[index]);
				}
			}
			return Promise.resolve();
		});
	});
}

function done() {
	return Promise.resolve();
}

testAPI.startNexlApp(init, run, done);