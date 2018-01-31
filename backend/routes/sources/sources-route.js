const express = require('express');
const path = require('path');

const sources = require('./sources-route-impl');
const utils = require('../../api/utils');
const security = require('../../api/security');

const router = express.Router();

router.post('/get-nexl-sources', function (req, res, next) {
	var relativePath = req.body['relativePath'] || path.sep;
	var username = utils.resolveUsername(req);

	if (!security.hasReadPermission(username)) {
		utils.sendError(res, 'You don\'t have a read permission');
		return;
	}

	sources.getNexlSources(relativePath).then(
		function (data) {
			res.send(data);
		}).catch(
		function (err) {
			utils.sendError(res, err);
		});
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
