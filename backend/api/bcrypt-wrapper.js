const bcrypt = require('bcrypt');
const logger = require('./logger');
const utils = require('./utils');

const SALT_ROUNDS = 10;

function hash(password) {
	return new Promise((resolve, reject) => {
		bcrypt.hash(password, SALT_ROUNDS, function (err, hash) {
			if (err) {
				logger.log.error('Failed to generate new hash. Reason : [%s]', utils.formatErr(err));
				reject('Failed to generate new hash');
				return;
			}

			resolve(hash);
		});
	});
}

function compare(password, hash) {
	return new Promise((resolve, reject) => {
		bcrypt.compare(password, hash, function (err, res) {
			if (err) {
				logger.log.error('Failed to compare hashes. Reason : [%s]', utils.formatErr(err));
				reject('Failed to compare hashes');
				return;
			}

			resolve(res);
		});
	});
}

// --------------------------------------------------------------------------------
module.exports.hash = hash;
module.exports.compare = compare;
// --------------------------------------------------------------------------------
