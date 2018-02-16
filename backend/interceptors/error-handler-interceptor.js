const logger = require('../api/logger');
const util = require('../api/utils');

module.exports = function (err, req, res, next) {
	logger.log.error('Error occurred !', err.message);
	logger.log.error(err.stack);
	util.sendError(res, 'Internal server error !')
};