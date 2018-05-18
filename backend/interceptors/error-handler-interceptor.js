const logger = require('../api/logger');
const utils = require('../api/utils');

module.exports = function (err, req, res, next) {
	logger.log.error('Error occurred ! Reason : [%s]', utils.formatErr(err));
	utils.sendError(res, 'Internal server error !')
};