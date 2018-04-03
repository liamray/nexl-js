const fs = require('fs');
const logger = require('./logger');

module.exports.exists = (fullPath) => {
	return new Promise((resolve, reject) => {
		try {
			fs.exists(fullPath, (isExists) => {
				resolve(isExists);
			});
		} catch (e) {
			logger.log.error('Failed to check is the [%s] file exists. Reason : [%s]', fullPath, err);
			reject('Failed to check is file exists');
		}
	});
};

module.exports.readFile = (fullPath, opts) => {
	return new Promise((resolve, reject) => {
		try {
			fs.readFile(fullPath, opts, (err, data) => {
				if (err) {
					reject(err);
					return;
				}

				resolve(data);
			});
		} catch (err) {
			logger.log.error('Failed to read file content for [%s] file. Reason : [%s]', fullPath, err);
			reject('Failed to read file');
		}
	});
};

module.exports.writeFile = (fullPath, data, opts) => {
	return new Promise((resolve, reject) => {
		try {
			fs.writeFile(fullPath, data, opts, (err) => {
				if (err) {
					reject(err);
					return;
				}

				resolve();
			});
		} catch (e) {
			logger.log.error('Failed to write file content for [%s] file. Reason : [%s]', fullPath, err);
			reject('Failed to write file');
		}
	});
};

module.exports.stat = (fullPath) => {
	return new Promise((resolve, reject) => {
		fs.stat(fullPath, (err, stats) => {
			if (err) {
				reject(err);
				return;
			}

			resolve(stats);
		})
	});
};