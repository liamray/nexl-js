const logger = require('../api/logger');
const utils = require('../api/utils');

module.exports = function (err, req, res, next) {
	logger.log.error('Error occurred !', utils.sendError(err.message));
	logger.log.error(err.stack);
	utils.sendError(res, 'Internal server error !')
};