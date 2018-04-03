const j79 = require('j79-utils');
const util = require('util');

// todo : add log

function resolveSchema(key, objectSchema) {
	// any key
	if (objectSchema['*'] !== undefined) {
		return objectSchema['*'];
	}

	// specific key
	return objectSchema[key];
}

function objectSchemaValidation(data, objectSchema) {
	if (!j79.isObject(data)) {
		return util.format('Wrong data structure. Expecting for object, but got a %s', j79.getType(data));
	}

	for (let key in data) {
		let schema = resolveSchema(key, objectSchema);
		if (schema === undefined) {
			return util.format('Got unrecognized object field [%s]', key);
		}

		let val = data[key];

		const result = schemaValidation(val, schema);
		if (j79.isString(result)) {
			return result;
		}
	}
}

function arraySchemaValidation(data, arraySchema) {
	if (!j79.isArray(data)) {
		return 'Wrong data structure. Expecting for array, but got a [' + j79.getType(data) + ']';
	}

	for (let index in data) {
		let item = data[index];

		const result = schemaValidation(item, arraySchema);
		if (j79.isString(result)) {
			return result;
		}
	}
}

function schemaValidation(data, schema) {
	if (j79.isFunction(schema)) {
		return schema(data);
	}

	if (j79.isArray(schema)) {
		return arraySchemaValidation(data, schema[0]);
	}

	if (j79.isObject(schema)) {
		return objectSchemaValidation(data, schema);
	}

	throw 'API error : wrong schema';
}


// --------------------------------------------------------------------------------
module.exports = schemaValidation;
// --------------------------------------------------------------------------------