const logger = require('../api/logger');
const security = require('../api/security');

module.exports = function (err, req, res, next) {
	logger.log.error('Error occurred ! Reason : [%s]', utils.formatErr(err));
	security.sendError(res, 'Internal server error !')
};