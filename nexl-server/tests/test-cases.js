var queryString = require('querystring');

const testCases = [];
module.exports = testCases;

// positive result, json
testCases.push({
	options: {
		host: 'localhost',
		port: 8080,
		path: '/nexl-source1.js?expression=${HOSTS.APP_SERVER_INTERFACES.PROD}',
		method: 'GET'
	},

	result: {
		expectedHeader: 'application/json',
		expectedStatusCode: 200,
		expectedResult: '{"FIRST":["hothead1","awakening1","dynamite1","military1"],"SECOND":["cuddly2","grease2","fate2","atmosphere2"]}'
	}
});

// positive result, array
testCases.push({
	options: {
		host: 'localhost',
		port: 8080,
		path: '/nexl-source1.js?expression=${HOSTS.APP_SERVER_INTERFACES.PROD~K}',
		method: 'GET'
	},

	result: {
		expectedHeader: 'application/json',
		expectedStatusCode: 200,
		expectedResult: '["FIRST","SECOND"]'
	}
});

// positive result, string
testCases.push({
	options: {
		host: 'localhost',
		port: 8080,
		path: '/nexl-source1.js?expression=${HOSTS.APP_SERVER_INTERFACES.PROD.FIRST[0]}',
		method: 'GET'
	},

	result: {
		expectedHeader: 'text/plain; charset=utf-8',
		expectedStatusCode: 200,
		expectedResult: 'hothead1'
	}
});

// positive result, numeric
testCases.push({
	options: {
		host: 'localhost',
		port: 8080,
		path: '/nexl-source1.js?expression=${@11:num}',
		method: 'GET'
	},

	result: {
		expectedHeader: 'text/plain; charset=utf-8',
		expectedStatusCode: 200,
		expectedResult: '11'
	}
});

// undefined value
testCases.push({
	options: {
		host: 'localhost',
		port: 8080,
		path: '/nexl-source1.js?expression=${}',
		method: 'GET'
	},

	result: {
		expectedHeader: undefined,
		expectedStatusCode: 500,
		expectedResult: 'Got undefined value'
	}
});

// mandatory value
testCases.push({
	options: {
		host: 'localhost',
		port: 8080,
		path: '/nexl-source1.js?expression=${*}',
		method: 'GET'
	},

	result: {
		expectedHeader: undefined,
		expectedStatusCode: 500,
		expectedResult: 'The [${*}] expression cannot be evaluated to undefined ( it has a mandatory value validator ). Probably you have to provide it as external arg or check why it calculated to undefined'
	}
});

// POST, positive result, array
testCases.push({
	options: {
		host: 'localhost',
		port: 8080,
		path: '/nexl-source1.js',
		form: {'expression': ''},
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(queryString.stringify({
				expression: '${HOSTS.APP_SERVER_INTERFACES.PROD~K}'
			}))
		},
		method: 'POST'
	},

	result: {
		expectedHeader: 'application/json',
		expectedStatusCode: 200,
		expectedResult: '["FIRST","SECOND"]'
	}
});

// POST, positive result, array
testCases.push({
	options: {
		host: 'localhost',
		port: 8080,
		path: '/nexl-source1.js',
		data: queryString.stringify({
			expression: '${HOSTS.APP_SERVER_INTERFACES.PROD~K}'
		}),
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(queryString.stringify({
				expression: '${HOSTS.APP_SERVER_INTERFACES.PROD~K}'
			}))
		},
		method: 'POST'
	},

	result: {
		expectedHeader: 'application/json',
		expectedStatusCode: 200,
		expectedResult: '["FIRST","SECOND"]'
	}
});
