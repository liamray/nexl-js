module.exports = [];

// 1)
module.exports.push({
	request: {
		source: '/nexl-source1.js',
		args: {
			expression: '${HOSTS.APP_SERVER_INTERFACES.PROD}'
		}
	},

	result: {
		expectedHeader: 'application/json',
		expectedStatusCode: 200,
		expectedResult: '{"FIRST":["hothead1","awakening1","dynamite1","military1"],"SECOND":["cuddly2","grease2","fate2","atmosphere2"]}'
	}
});


// 2)
module.exports.push({
	request: {
		source: '/nexl-source1.js',
		args: {
			expression: '${HOSTS.APP_SERVER_INTERFACES.PROD~K}'
		}
	},

	result: {
		expectedHeader: 'application/json',
		expectedStatusCode: 200,
		expectedResult: '["FIRST","SECOND"]'
	}
});

// 3)
module.exports.push({
	request: {
		source: '/nexl-source1.js',
		args: {
			expression: '${HOSTS.APP_SERVER_INTERFACES.PROD.FIRST[0]}'
		}
	},

	result: {
		expectedHeader: 'text/plain; charset=utf-8',
		expectedStatusCode: 200,
		expectedResult: 'hothead1'
	}
});

// 4)
module.exports.push({
	request: {
		source: '/nexl-source1.js',
		args: {
			expression: '${@11:num}'
		}
	},

	result: {
		expectedHeader: 'text/plain; charset=utf-8',
		expectedStatusCode: 200,
		expectedResult: '11'
	}
});

// 5)
module.exports.push({
	request: {
		source: '/nexl-source1.js',
		args: {
			expression: '${}'
		}
	},

	result: {
		expectedHeader: undefined,
		expectedStatusCode: 500,
		expectedResult: 'Got undefined value'
	}
});

// 6)
module.exports.push({
	request: {
		source: '/nexl-source1.js',
		args: {
			expression: '${*}'
		}
	},

	result: {
		expectedHeader: undefined,
		expectedStatusCode: 500,
		expectedResult: 'The [${*}] expression cannot be evaluated to undefined ( it has a mandatory value validator ). Probably you have to provide it as external arg or check why it calculated to undefined'
	}
});

// 7)
module.exports.push({
	request: {
		source: '/nexl-source1.js',
		args: {
			expression: ''
		}
	},

	result: {
		expectedHeader: 'text/plain; charset=utf-8',
		expectedStatusCode: 200,
		expectedResult: ''
	}
});

// 8)
module.exports.push({
	request: {
		source: '/nexl-source1.js',
		args: {}
	},

	result: {
		expectedHeader: 'text/plain; charset=utf-8',
		expectedStatusCode: 200,
		expectedResult: '25'
	}
});

// 9)
module.exports.push({
	request: {
		source: '/nexl-source1.js',
		args: {
			test1: '0312 Hello'
		}
	},

	result: {
		expectedHeader: 'text/plain; charset=utf-8',
		expectedStatusCode: 200,
		expectedResult: '0312 Hello'
	}
});

// 10)
module.exports.push({
	request: {
		source: '/nexl-source1.js',
		args: {
			expression: '${arr1&\n} ${arr1&\t}'
		}
	},

	result: {
		expectedHeader: 'text/plain; charset=utf-8',
		expectedStatusCode: 200,
		expectedResult: 'queen\nmuscle\n79\nfalse queen\tmuscle\t79\tfalse'
	}
});
