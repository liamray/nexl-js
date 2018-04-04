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
			logger.log.error('Failed to get nexl source file content for [%s] file. Reason : [%s]', relativePath, err);
			utils.sendError(res, err);
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
		data => res.send(data)
	).catch(
		(err) => {
			logger.log.error('Failed to resolve nexl sources. Reason : [%s]', err);
			utils.sendError(res, err);
		});
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
