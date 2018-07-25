const logger = require('../api/logger');
const security = require('../api/security');

module.exports = function (req, res, next) {
	logger.log.error('404 => requested URL [%s] not found', req.originalUrl);
	security.sendError(res, '404 => Requested URL not Found !', 404);
};