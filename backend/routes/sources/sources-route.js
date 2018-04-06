const express = require('express');
const path = require('path');

const sources = require('./sources-route-impl');
const utils = require('../../api/utils');
const security = require('../../api/security');
const logger = require('../../api/logger');

const router = express.Router();

router.post('/get-source-content', function (req, res, next) {
	const relativePath = req.body['relativePath'] || path.sep;
	const username = utils.getLoggedInUsername(req);

	security.hasReadPermission(username).then((hasPermission) => {
		if (!hasPermission) {
			logger.log.error('The [%s] user doesn\'t have read permissions to get nexl source content', username);
			return Promise.reject('No read permissions');
		}

		return sources.getSourceContent(relativePath).then(data => res.send(data));
	}).catch((err) => {
		logger.log.error('Failed to get nexl source content for [%s] user. Reason : [%s]', username, err);
		utils.sendError(res, err);
	});
});

router.post('/get-nexl-sources', function (req, res, next) {
	const relativePath = req.body['relativePath'] || path.sep;
	const username = utils.getLoggedInUsername(req);

	security.hasReadPermission(username).then((hasPermission) => {
		if (!hasPermission) {
			logger.log.error('The [%s] user doesn\'t have read permissions to list nexl sources', username);
			return Promise.reject('No read permissions');
		}

		return sources.getNexlSources(relativePath).then(data => res.send(data));
	}).catch((err) => {
		logger.log.error('Failed to list nexl sources for [%s] user. Reason : [%s]', username, err);
		utils.sendError(res, err);
	});
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
