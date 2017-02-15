var PARSED_STR = {
	str: 'the original str',
	chunks: ['hello', 'world', null, 'test'],
	chunkSubstitutions: {
		2: 'NEXL_EXPRESSION_DEFINITION' // key points to a null value in chunks
	}
};


var NEXL_EXPRESSION_DEFINITION = {

	str: 'the original expression',

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
			arrayIndexes: [
				{
					min: 'PRIMITIVE_INT',
					max: 'NEXL_EXPRESSION_DEFINITION'
				}
			]
		}
	],

	modifiers: [
		{
			id: '@',
			md: 'PARSED_STR'
		}
	]
};