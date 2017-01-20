var PARSED_STR = {
	chunks: ['hello', 'world', null, 'test'],
	chunkSubstitutions: {
		2: 'NEXL_EXPRESSION_DEFINITION' // key points to a null value in chunks
	}
};


var NEXL_EXPRESSION_DEFINITION = {

	length: 15,

	actions: [
		{ // object action
			chunks: [],
			chunkSubstitutions: {
				0: 'NEXL_EXPRESSION_DEFINITION'
			}
		},
		{ // function call action
			funcParams: [
				'NEXL_EXPRESSION_DEFINITION',
				'NEXL_EXPRESSION_DEFINITION'
			]
		},
		{ // array index access action
			min: 'PRIMITIVE_INT',
			max: 'NEXL_EXPRESSION_DEFINITION'
		}
	],

	modifiers: [
		{
			id: ':',
			value: 'PARSED_STR',
			type: 'num'
		}
	]
};