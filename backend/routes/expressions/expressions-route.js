const express = require('express');
const router = express.Router();
const nexlEngine = require('nexl-engine');
const logger = require('../../api/logger');
const utils = require('../../api/utils');
const j79 = require('j79-utils');

function makeNexlRequest(req) {
	return {
		nexlSource: {},
		item: '',
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

	res.send(result);
}

router.get('/*', function (req, res, next) {
	nexlize(req, res);
});

router.post('/*', function (req, res, next) {
	nexlize(req, res);
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
