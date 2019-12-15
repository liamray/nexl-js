const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const logger = require('./logger');
const utils = require('./utils');
const confConsts = require('../common/conf-constants');

function join() {
	const args = Array.prototype.slice.call(arguments);
	try {
		return Promise.resolve(path.join.apply(null, args));
	} catch (e) {
		return Promise.reject(`Failed to join path elements. Reason: [${utils.formatErr(e)}]`);
	}
}

function mkdir(fullPath) {
	return new Promise((resolve, reject) => {
		fs.mkdir(fullPath, (err) => {
			if (err) {
				reject(`'Failed to create a [${fullPath}] directory. Reason : [${utils.formatErr(err)}]`);
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
				reject(`Failed to load the [${fullPath}] file. Reason : [${utils.formatErr(err)}]`);
				return;
			}

			logger.log.debug('The [%s] file has been read', fullPath);
			resolve(data);
		});
	});
}

function readFileUTF8(fullPath) {
	return readFile(fullPath, {encoding: confConsts.ENCODING_UTF8});
}

function writeFile(fullPath, data, opts) {
	return new Promise((resolve, reject) => {
		fs.writeFile(fullPath, data, opts, (err) => {
			if (err) {
				reject(`Failed to save the [${fullPath}] file. Reason : [${utils.formatErr(err)}]`);
				return;
			}

			logger.log.debug('Data has been written to the [%s] file', fullPath);
			resolve();
		});
	});
}

function writeFileUTF8(fullPath, data) {
	return writeFile(fullPath, data, {encoding: confConsts.ENCODING_UTF8});
}

function stat(fullPath) {
	return new Promise((resolve, reject) => {
		fs.stat(fullPath, (err, stats) => {
			if (err) {
				reject(`Failed to retrieve file stat for [${fullPath}]. Reason : [${utils.formatErr(err)}]`);
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
				reject(`Failed to list directory items in [${fullPath}] path. Reason : [${utils.formatErr(err)}]`);
				return;
			}

			logger.log.debug('The [%s] directory content has been read', fullPath);
			resolve(items);
		});
	});
}

function deleteItem(fullPath) {
	return fse.remove(fullPath)
		.then(() => {
			logger.log.debug('Deleted [%s] item', fullPath);
			return Promise.resolve();
		})
		.catch(err => {
			return Promise.reject(`Failed to delete the [${fullPath}] item. Reason : [${utils.formatErr(err)}]`);
		});
}

function rename(oldName, newName) {
	return new Promise(
		(resolve, reject) => {
			fs.rename(oldName, newName, (err) => {
				if (err) {
					reject(`Failed to rename a [${oldName}] item to [${newName}]. Reason : [${utils.formatErr(err)}]`);
					return;
				}

				logger.log.debug('The [%s] item renamed to [%s]', oldName, newName);
				resolve();
			});
		});
}

function move(src, dest) {
	return fse.move(src, dest, {override: false});
}

// --------------------------------------------------------------------------------
module.exports.join = join;
module.exports.mkdir = mkdir;
module.exports.exists = exists;
module.exports.readFile = readFile;
module.exports.writeFile = writeFile;
module.exports.readFileUTF8 = readFileUTF8;
module.exports.writeFileUTF8 = writeFileUTF8;
module.exports.stat = stat;
module.exports.readdir = readdir;
module.exports.deleteItem = deleteItem;
module.exports.rename = rename;
module.exports.move = move;
// --------------------------------------------------------------------------------
