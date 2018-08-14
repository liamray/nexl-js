const j79 = require('j79-utils');
const util = require('util');
const logger = require('./logger');
const schemas = require('../common/schemas');

function objectSchemaValidation(data, objectSchema) {
	// validating by schema
	for (let key in objectSchema) {
		const val = data[key];
		const schema = objectSchema[key];

		if (key !== '*') {
			const validationResult = schemaValidation(val, schema);
			if (!validationResult.isValid) {
				return validationResult;
			}

			continue;
		}

		// iterating over each key\value pair in object and validating each one because of *
		for (let subKey in data) {
			const validationResult = schemaValidation(data[subKey], schema);
			if (!validationResult.isValid) {
				return validationResult;
			}
		}
	}

	if (objectSchema['*'] !== undefined) {
		return schemas.valid();
	}

	// checking for unexpected keys in data
	for (let key in data) {
		if (objectSchema[key] === undefined) {
			return schemas.invalid(`Object contains unrecognized [${key}] field`);
		}
	}

	return schemas.valid();
}

function arraySchemaValidation(data, arraySchema) {
	for (let index in data) {
		let item = data[index];

		const validationResult = schemaValidation(item, arraySchema);
		if (!validationResult.isValid) {
			return validationResult;
		}
	}

	return schemas.valid();
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

	return schema.invalid('API error : wrong schema');
}

function schemaValidationWrapper(data, schema) {
	const result = schemaValidation(data, schema);
	return result;
}

// --------------------------------------------------------------------------------
module.exports = schemaValidationWrapper;
// --------------------------------------------------------------------------------