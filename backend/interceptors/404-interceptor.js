const logger = require('../api/logger');
const utils = require('../api/utils');

module.exports = function (req, res, next) {
	logger.log.error('404 => requested URL [%s] not found', req.originalUrl);
	utils.sendError(res, '404 => Requested URL not Found !', 404);
};