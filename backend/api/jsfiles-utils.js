const fs = require('fs');
const path = require('path');
const util = require('util');
const j79 = require('j79-utils');

const fsx = require('./fsx');
const logger = require('./logger');
const confMgmt = require('./conf-mgmt');
const utils = require('./utils');

let JS_FILES_CACHE = [];

const CHILD_ITEM = [
	{
		label: 'Loading...',
		disabled: true
	}
];

function sortFilesFunc(a, b) {
	if (a.label.toUpperCase() > b.label.toUpperCase()) {
		return 1;
	}
	if (a.label.toUpperCase() < b.label.toUpperCase()) {
		return -1;
	}
	return 0;
}

function getJSFileFullPath(relativePath) {
	if (!utils.isFilePathValid(relativePath)) {
		logger.log.error('The [%s] path is unacceptable', relativePath);
		return Promise.reject('Unacceptable path');
	}

	const fullPath = path.join(confMgmt.getNexlSourcesDir(), relativePath || '');

	if (!utils.isFilePathValid(fullPath)) {
		logger.log.error('The [%s] path is unacceptable', fullPath);
		return Promise.reject('Unacceptable path');
	}

	return Promise.resolve(fullPath);
}

function getJSFilesRootDirPath(relativePath) {
	if (!utils.isDirPathValid(relativePath)) {
		logger.log.error('The [%s] path is unacceptable', relativePath);
		return Promise.reject('Unacceptable path');
	}

	const fullPath = path.join(confMgmt.getNexlSourcesDir(), relativePath || '');

	if (!utils.isDirPathValid(fullPath)) {
		logger.log.error('The [%s] path is unacceptable', fullPath);
		return Promise.reject('Unacceptable path');
	}

	return Promise.resolve(fullPath);
}

function makeDirItem(item, relativePath) {
	return {
		label: item,
		items: CHILD_ITEM.slice(),
		value: {
			relativePath: relativePath,
			label: item,
			mustLoadChildItems: true,
			isDir: true
		}
	}
}

function makeFileItem(item, relativePath) {
	return {
		label: item,
		value: {
			relativePath: relativePath,
			label: item,
			mustLoadChildItems: false,
			isDir: false
		}
	}
}

function assembleItemsPromised(relativePath, jsFilesRootDir, items) {
	return Promise.resolve().then(() => {
			let files = [];
			let dirs = [];
			const promises = [];

			// gathering promises
			for (let index in items) {
				let item = items[index];

				const itemRelativePath = path.join(relativePath, item);
				if (!utils.isFilePathValid(itemRelativePath)) {
					logger.log.error('The [%s] path is unacceptable', relativePath);
					return Promise.reject('Unacceptable path');
				}

				const fullPath = path.join(jsFilesRootDir, itemRelativePath);
				const promise = fsx.stat(fullPath).then(
					(stats) => {
						if (stats.isDirectory()) {
							dirs.push(makeDirItem(item, itemRelativePath));
						}

						if (stats.isFile()) {
							files.push(makeFileItem(item, itemRelativePath));
						}

						return Promise.resolve();
					}
				);

				promises.push(promise);
			}

			// executing all promises
			return Promise.all(promises).then(
				() => {
					files = files.sort(sortFilesFunc);
					dirs = dirs.sort(sortFilesFunc);

					return Promise.resolve([].concat(dirs).concat(files));
				});
		}
	);
}

function loadJSFile(relativePath) {
	return getJSFileFullPath(relativePath).then(
		(fullPath) => {
			return fsx.exists(fullPath).then(
				(isExists) => {
					if (!isExists) {
						logger.log.error('The [%s] JavaScript file doesn\'t exist', fullPath);
						return Promise.reject('JavaScript file doesn\'t exist !');
					}

					const encoding = confMgmt.getNexlSettingsCached()[confMgmt.SETTINGS.NEXL_SOURCES_ENCODING];
					return fsx.readFile(fullPath, {encoding: encoding});
				});
		}
	);
}

function saveJSFile(relativePath, content) {
	return getJSFileFullPath(relativePath).then(
		(fullPath) => {
			const encoding = confMgmt.getNexlSettingsCached()[confMgmt.SETTINGS.NEXL_SOURCES_ENCODING];
			return fsx.writeFile(fullPath, content, {encoding: encoding});
		}
	);
}

function listJSFiles(relativePath) {
	return getJSFilesRootDirPath(relativePath).then(fsx.readdir)
		.then(
			(items) => assembleItemsPromised(relativePath, confMgmt.getNexlSourcesDir(), items)
		);
}

function mkdir(relativePath) {
	return getJSFileFullPath(relativePath).then(
		(fullPath) => {
			return fsx.exists(fullPath).then((isExists) => {
				if (isExists) {
					logger.log.error('The [%s] directory or file already exists', fullPath);
					return Promise.reject('Directory or file already exists');
				}

				return fsx.mkdir(fullPath);
			});
		});
}

function deleteItem(relativePath) {
	return getJSFileFullPath(relativePath).then(fsx.deleteItem);
}

function rename(oldRelativePath, newRelativePath) {
	return getJSFileFullPath(newRelativePath).then(
		(newFullPath) => {
			return fsx.exists(newFullPath).then(
				(isExists) => {
					if (isExists) {
						logger.log.error('Cannot rename a [%s] to [%s] because the [%s] already exists', oldRelativePath, newRelativePath, newRelativePath);
						return Promise.reject('Item with the same name already exists');
					}

					return getJSFileFullPath(oldRelativePath).then(
						(oldFullPath) => {
							return fsx.rename(oldFullPath, newFullPath);
						}
					);

				}
			);
		}
	);
}

function moveInner(sourceStuff, destStuff) {
	return fsx.exists(sourceStuff).then(
		(isSrcExists) => {
			if (!isSrcExists) {
				logger.log.error('Failed to move a [%s] source item to [%s] destination item. Reason : source item doesn\'t exist', sourceStuff, destStuff);
				return Promise.reject('Source item doesn\'t exist');
			}

			const destItem = path.join(destStuff, path.basename(sourceStuff));

			return fsx.exists(destItem).then(
				(isDestExists) => {
					if (isDestExists) {
						logger.log.error('Failed to move a [%s] source item to [%s] destination item. Reason : destination item already exists', sourceStuff, destItem);
						return Promise.reject('Destination item already exist');
					}

					// moving...
					return fsx.move(sourceStuff, destItem);
				}
			);
		}
	);
}

function move(source, dest) {
	return getJSFileFullPath(source).then(
		(sourceFullPath) => {
			return getJSFilesRootDirPath(dest).then(
				(destFullPath) => {
					return moveInner(sourceFullPath, destFullPath);
				}
			);
		}
	);
}

function gatherAllFiles(relativePath) {
	const jsFilesRootDir = confMgmt.getNexlSourcesDir();
	const listItemsFullPath = path.join(jsFilesRootDir, relativePath);
	return fsx.readdir(listItemsFullPath)
		.then(
			(items) => {
				const promises = [];
				items.forEach(
					(item) => {
						const itemFullPath = path.join(listItemsFullPath, item);
						const promise = fsx.stat(itemFullPath).then(
							(stats) => {
								if (stats.isFile()) {
									return Promise.resolve(path.join(relativePath, item));
								}

								if (stats.isDirectory()) {
									return gatherAllFiles(path.join(relativePath, item));
								}

								logger.log.warn('Unknown FS object [%s] ( not a file or directory ). Skipping...', itemFullPath);
								return Promise.resolve();
							}
						);
						promises.push(promise);
					}
				);

				let result = [];
				return Promise.all(promises).then(
					(allResult) => {
						allResult.forEach(
							(item) => {
								if (j79.isArray(item)) {
									result = result.concat(item);
								}

								if (j79.isString(item)) {
									result.push(item);
								}
							}
						);

						return Promise.resolve(result);
					}
				);
			}
		);
}

function cacheJSFiles() {
	const jsFilesRootDir = confMgmt.getNexlSourcesDir();
	logger.log.info('Caching JavaScript file names located in [%s] directory', jsFilesRootDir);

	return gatherAllFiles(path.sep).then(
		(result) => {
			JS_FILES_CACHE = result;
			logger.log.info('Found and cached [%s] files located in [%s] directory', JS_FILES_CACHE.length, jsFilesRootDir);
			return Promise.resolve();
		}
	);
}

// --------------------------------------------------------------------------------
module.exports.listJSFiles = listJSFiles;
module.exports.loadJSFile = loadJSFile;
module.exports.saveJSFile = saveJSFile;
module.exports.mkdir = mkdir;
module.exports.deleteItem = deleteItem;
module.exports.rename = rename;
module.exports.move = move;

module.exports.cacheJSFiles = cacheJSFiles;
module.exports.listAllJSFiles = () => JS_FILES_CACHE;
// --------------------------------------------------------------------------------
