const bcrypt = require('bcryptjs');
const logger = require('./logger');
const utils = require('./utils');

const SALT_ROUNDS = 10;

function hash(password) {
	return new Promise((resolve, reject) => {
		bcrypt.genSalt(SALT_ROUNDS, function (err, salt) {
			bcrypt.hash(password, salt, function (err, hash) {
				if (err) {
					reject(`Failed to generate new hash. Reason: [${utils.formatErr(err)}]`);
					return;
				}

				resolve(hash);
			});
		});
	});
}

function compare(password, hash) {
	return new Promise((resolve, reject) => {
		bcrypt.compare(password, hash, function (err, res) {
			if (err) {
				reject(`Failed to compare hashes. Reason: [${utils.formatErr(err)}]`);
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