const express = require('express');
const router = express.Router();
const nexlEngine = require('nexl-engine');
const logger = require('../../api/logger');
const utils = require('../../api/utils');
const j79 = require('j79-utils');

function makeNexlRequest(req) {
	return {
		nexlSource: {
			asText: {
				text: 'x = [79];'
			}
		},
		item: '${x}',
		args: ''
	};
}

function nexlizeInner(req) {
	const nexlRequest = makeNexlRequest(req);
	return nexlEngine.nexlize(nexlRequest.nexlSource, nexlRequest.item, nexlRequest.args);
}

function nexlize(req, res) {
	let result;

	try {
		result = nexlizeInner(req);
	} catch (e) {
		logger.log.error('nexl request rejected. Reason : [%s]', e);
		utils.sendError(res, e, 500);
		return;
	}

	// is undefined ?
	if (!j79.isValSet(result)) {
		logger.log.error('Got undefined value');
		utils.sendError(res, e, 555);
		return;
	}

	if (j79.isArray(result) || j79.isObject(result)) {
		res.header("Content-Type", 'application/json');
	} else {
		res.header("Content-Type", 'text/plain');
	}

	// string sends as is. all other must be stringified
	if (j79.isString(result)) {
		res.send(result);
	} else {
		res.send(JSON.stringify(result));
	}
}

router.get('/*', function (req, res) {
	nexlize(req, res);
});

router.post('/*', function (req, res) {
	nexlize(req, res);
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
