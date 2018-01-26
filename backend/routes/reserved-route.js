const express = require('express');
const utils = require('../api/utils');

const router = express.Router();

router.get('/', function (req, res, next) {
	utils.sendError(res, '[/nexl] path is reserved for internal purposes');
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
