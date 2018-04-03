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

	if (!security.hasReadPermission(username)) {
		logger.log.error('The [%s] user doesn\'t have read permissions to get nexl source', username);
		utils.sendError(res, 'You don\'t have a read permission');
		return;
	}

	sources.getSourceContent(relativePath).then(
		data => res.send(data)
	).catch(
		(err) => {
			logger.log.error('Failed to get nexl source file content for [%s] file. Reason : [%s]', relativePath, err.toString());
			utils.sendError(res, err.toString());
		}
	);
});

router.post('/get-nexl-sources', function (req, res, next) {
	const relativePath = req.body['relativePath'] || path.sep;
	const username = utils.getLoggedInUsername(req);

	if (!security.hasReadPermission(username)) {
		logger.log.error('The [%s] user doesn\'t have read permissions to get nexl sources', username);
		utils.sendError(res, 'You don\'t have a read permission');
		return;
	}

	sources.getNexlSources(relativePath).then(
		function (data) {
			res.send(data);
		}).catch(
		function (err) {
			logger.log.error('Internal server error', err.toString());
			utils.sendError(res, 'Internal server error');
		});
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
