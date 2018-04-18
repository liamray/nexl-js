const fs = require('fs');
const fsextra = require('fs-extra');
const path = require('path');
const rimraf = require('rimraf');
const logger = require('./logger');
const utils = require('./utils');

function join() {
	const args = Array.prototype.slice.call(arguments);
	try {
		return Promise.resolve(path.join.apply(null, args));
	} catch (e) {
		logger.log.error('Failed to join path elements. Reason : [%s]', utils.formatErr(e));
		return Promise.reject('Failed to join path elements');
	}
}

function mkdir(fullPath) {
	return new Promise((resolve, reject) => {
		fs.mkdir(fullPath, (err) => {
			if (err) {
				logger.log.error('Failed to create a [%s] directory. Reason : [%s]', fullPath, utils.formatErr(err));
				reject('Failed to create directory');
				return;
			}

			logger.log.debug('The [%s] directory has been created', fullPath);
			resolve();
		});
	});
}

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

			logger.log.debug('The [%s] file has been read', fullPath);
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

			logger.log.debug('Data has been written to the [%s] file', fullPath);
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

			logger.log.debug('Stat for [%s] has been resolved', fullPath);
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
				return;
			}

			logger.log.debug('The [%s] directory content has been read', fullPath);
			resolve(items);
		});
	});
}

function deleteItem(fullPath) {
	return fsextra.remove(fullPath)
		.then(() => {
			logger.log.debug('Deleted [%s] item', fullPath);
			return Promise.resolve();
		})
		.catch(err => {
			logger.log.error('Failed to delete the [%s] item. Reason : [%s]', utils.formatErr(err));
			return Promise.reject('Failed to delete item');
		});
}

// --------------------------------------------------------------------------------
module.exports.join = join;
module.exports.mkdir = mkdir;
module.exports.exists = exists;
module.exports.readFile = readFile;
module.exports.writeFile = writeFile;
module.exports.stat = stat;
module.exports.readdir = readdir;
module.exports.deleteItem = deleteItem;
// --------------------------------------------------------------------------------
