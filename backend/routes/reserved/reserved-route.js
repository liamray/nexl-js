const express = require('express');
const utils = require('../../api/utils');
const logger = require('../../api/logger');

const router = express.Router();

router.get('/', function (req, res, next) {
	logger.log.error('[/nexl] path is reserved for internal use');
	utils.sendError(res, '[/nexl] path is reserved for internal use');
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
