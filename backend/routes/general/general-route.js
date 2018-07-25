const express = require('express');
const router = express.Router();
const path = require('path');

const j79 = require('j79-utils');

const version = require('./../../../package.json').version;

const security = require('../../api/security');
const restUrls = require('../../common/rest-urls');
const logger = require('../../api/logger');

//////////////////////////////////////////////////////////////////////////////
// sends server info
//////////////////////////////////////////////////////////////////////////////
router.post(restUrls.GENERAL.URLS.INFO, function (req, res) {
	logger.log.debug(`Resolving server information`);

	res.send({
		SLASH: path.sep,
		OS: process.platform,
		VERSION: version
	});
});

//////////////////////////////////////////////////////////////////////////////
// undeclared routes
//////////////////////////////////////////////////////////////////////////////
router.post('/*', function (req, res) {
	logger.log.error(`Unknown route [${req.baseUrl}]`);
	security.sendError(res, `Unknown route`, 404);
});

router.get('/*', function (req, res) {
	logger.log.error(`Unknown route [${req.baseUrl}]`);
	security.sendError(res, `Unknown route`, 404);
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
