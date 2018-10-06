module.exports = [];

module.exports.push({
	request: {
		source: '//expressions-test/file1.js',
		args: {
			expression: '${}'
		}
	},

	result: {
		expectedHeader: 'text/html; charset=utf-8',
		expectedStatusCode: 500,
		expectedResult: 'Unacceptable path ( relative path contains restricted characters )'
	}
});

module.exports.push({
	request: {
		source: '/../expressions-test/file1.js',
		args: {
			expression: '${}'
		}
	},

	result: {
		expectedHeader: 'text/html; charset=utf-8',
		expectedStatusCode: 500,
		expectedResult: 'Unacceptable path ( relative path contains restricted characters )'
	}
});

module.exports.push({
	request: {
		source: '/c:\\expressions-test/file1.js',
		args: {
			expression: '${}'
		}
	},

	result: {
		expectedHeader: 'text/html; charset=utf-8',
		expectedStatusCode: 500,
		expectedResult: 'Failed to read [file1.js] file content'
	}
});

module.exports.push({
	request: {
		source: '//expressions-test/file1.js',
		args: {
			expression: '${}'
		}
	},

	result: {
		expectedHeader: 'text/html; charset=utf-8',
		expectedStatusCode: 500,
		expectedResult: 'Unacceptable path ( relative path contains restricted characters )'
	}
});

module.exports.push({
	request: {
		source: '/expressions-test/file1.js',
		args: {
			expression: '${HOSTS.APP_SERVER_INTERFACES.PROD}'
		}
	},

	result: {
		expectedHeader: 'application/json; charset=utf-8',
		expectedStatusCode: 200,
		expectedResult: '{"FIRST":["hothead1","awakening1","dynamite1","military1"],"SECOND":["cuddly2","grease2","fate2","atmosphere2"]}'
	}
});

module.exports.push({
	request: {
		source: '/expressions-test/file1.js',
		args: {
			expression: '${HOSTS.APP_SERVER_INTERFACES.PROD~K}'
		}
	},

	result: {
		expectedHeader: 'application/json; charset=utf-8',
		expectedStatusCode: 200,
		expectedResult: '["FIRST","SECOND"]'
	}
});

module.exports.push({
	request: {
		source: '/expressions-test/file1.js',
		args: {
			expression: '${HOSTS.APP_SERVER_INTERFACES.PROD.FIRST[0]}'
		}
	},

	result: {
		expectedHeader: 'application/json; charset=utf-8',
		expectedStatusCode: 200,
		expectedResult: '"hothead1"'
	}
});

module.exports.push({
	request: {
		source: '/expressions-test/file1.js',
		args: {
			expression: '${@11:num}'
		}
	},

	result: {
		expectedHeader: 'application/json; charset=utf-8',
		expectedStatusCode: 200,
		expectedResult: '11'
	}
});

module.exports.push({
	request: {
		source: '/expressions-test/file1.js',
		args: {
			expression: '${}'
		}
	},

	result: {
		expectedHeader: 'text/html; charset=utf-8',
		expectedStatusCode: 555,
		expectedResult: 'Got undefined value'
	}
});

module.exports.push({
	request: {
		source: '/expressions-test/file1.js',
		args: {
			expression: '${:null}'
		}
	},

	result: {
		expectedHeader: 'text/html; charset=utf-8',
		expectedStatusCode: 556,
		expectedResult: 'Got null value for [guest] user'
	}
});

module.exports.push({
	request: {
		source: '/expressions-test/file1.js',
		args: {
			expression: '${*}'
		}
	},

	result: {
		expectedHeader: 'text/html; charset=utf-8',
		expectedStatusCode: 500,
		expectedResult: 'The [${*}] expression cannot be evaluated to undefined ( it has a mandatory value validator ). Probably you have to provide it as external arg or check why it calculated to undefined'
	}
});

module.exports.push({
	request: {
		source: '/expressions-test/file1.js',
		args: {
			expression: '${*Please provide something}'
		}
	},

	result: {
		expectedHeader: 'text/html; charset=utf-8',
		expectedStatusCode: 500,
		expectedResult: 'Please provide something'
	}
});

module.exports.push({
	request: {
		source: '/expressions-test/file1.js',
		args: {
			expression: ''
		}
	},

	result: {
		expectedHeader: 'application/json; charset=utf-8',
		expectedStatusCode: 200,
		expectedResult: '""'
	}
});

module.exports.push({
	request: {
		source: '/expressions-test/file1.js',
		args: {}
	},

	result: {
		expectedHeader: 'application/json; charset=utf-8',
		expectedStatusCode: 200,
		expectedResult: '25'
	}
});

module.exports.push({
	request: {
		source: '/expressions-test/file1.js',
		args: {
			test1: '0312 Hello'
		}
	},

	result: {
		expectedHeader: 'application/json; charset=utf-8',
		expectedStatusCode: 200,
		expectedResult: '"0312 Hello"'
	}
});

module.exports.push({
	request: {
		source: '/expressions-test/file1.js',
		args: {
			expression: '${arr1&\n} ${arr1&\t}'
		}
	},

	result: {
		expectedHeader: 'application/json; charset=utf-8',
		expectedStatusCode: 200,
		expectedResult: '"queen\\nmuscle\\n79\\nfalse queen\\tmuscle\\t79\\tfalse"'
	}
});