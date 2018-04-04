const fs = require('fs');
const logger = require('./logger');
const utils = require('./utils');

function exists(fullPath) {
	return new Promise((resolve, reject) => {
		fs.stat(fullPath, (err, stats) => {
			if (err) {
				logger.log.debug('The [%s] file doesn\'t exist', fullPath);
				resolve(false);
			} else {
				logger.log.debug('The [%s] file exists', fullPath);
				resolve(true);
			}
		})
	});
}

function readFile(fullPath, opts) {
	return new Promise((resolve, reject) => {
		fs.readFile(fullPath, opts, (err, data) => {
			if (err) {
				logger.log.error('Failed to read file content for [%s] file. Reason : [%s]', fullPath, utils.formatErr(err));
				reject('Failed to read file');
				return;
			}

			resolve(data);
		});
	});
}

function writeFile(fullPath, data, opts) {
	return new Promise((resolve, reject) => {
		fs.writeFile(fullPath, data, opts, (err) => {
			if (err) {
				logger.log.error('Failed to write file content for [%s] file. Reason : [%s]', fullPath, utils.formatErr(err));
				reject('Failed to write file');
				return;
			}

			resolve();
		});
	});
}

function stat(fullPath) {
	return new Promise((resolve, reject) => {
		fs.stat(fullPath, (err, stats) => {
			if (err) {
				logger.log.error('Failed to retrieve file stat for [%s]. Reason : [%s]', fullPath, utils.formatErr(err));
				reject('Failed to resolve file stat');
				return;
			}

			resolve(stats);
		})
	});
}

function readdir(fullPath) {
	return new Promise((resolve, reject) => {
		fs.readdir(fullPath, (err, items) => {
			if (err) {
				logger.log.error('Failed to read directory items in [%s] path. Reason : [%s]', fullPath, utils.formatErr(err));
				reject('Failed to read items list from directory');
			} else {
				resolve(items);
			}
		});
	});
}


// --------------------------------------------------------------------------------
module.exports.exists = exists;
module.exports.readFile = readFile;
module.exports.writeFile = writeFile;
module.exports.stat = stat;
module.exports.readdir = readdir;
// --------------------------------------------------------------------------------
