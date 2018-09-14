const path = require('path');
const j79 = require('j79-utils');

const fsx = require('./fsx');
const logger = require('./logger');
const confMgmt = require('./conf-mgmt');
const confConsts = require('../common/conf-constants');
const uiConsts = require('../common/ui-constants');
const di = require('../common/data-interchange-constants');
const utils = require('./utils');

let TREE_ITEMS = [];

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

	const fullPath = path.join(confMgmt.getNexlStorageDir(), relativePath || '');

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

	const fullPath = path.join(confMgmt.getNexlStorageDir(), relativePath || '');

	if (!utils.isDirPathValid(fullPath)) {
		logger.log.error('The [%s] path is unacceptable', fullPath);
		return Promise.reject('Unacceptable path');
	}

	return Promise.resolve(fullPath);
}

function loadFileFromStorage(relativePath) {
	return getJSFileFullPath(relativePath).then(
		(fullPath) => {
			return fsx.exists(fullPath).then(
				(isExists) => {
					if (!isExists) {
						logger.log.error('The [%s] JavaScript file doesn\'t exist', fullPath);
						return Promise.reject('JavaScript file doesn\'t exist !');
					}

					const encoding = confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.STORAGE_FILES_ENCODING];
					return fsx.readFile(fullPath, {encoding: encoding});
				});
		}
	);
}

function saveJSFileInnerInner(fullPath, content) {
	const data = {};

	const encoding = confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.STORAGE_FILES_ENCODING];

	return fsx.writeFile(fullPath, content, {encoding: encoding})
		.then(_ => fsx.stat(fullPath))
		.then(stat => Promise.resolve(data[di.FILE_LOAD_TIME] = stat.mtime.getTime()))
		.then(cacheStorageFiles)
		.then(_ => data);
}

function saveJSFileInner(fullPath, content, fileLoadTime) {
	if (fileLoadTime === undefined) {
		return saveJSFileInnerInner(fullPath, content);
	}

	// comparing fileLoadTime to last file modification time
	return fsx.stat(fullPath)
		.then(stat => {
			if (fileLoadTime >= stat.mtime.getTime()) {
				// file was modified on server before the fileLoadTime, just saving...
				return saveJSFileInnerInner(fullPath, content);
			}

			// file on the server was modified after it was opened by client
			// sending back newer file content
			const encoding = confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.STORAGE_FILES_ENCODING];
			return fsx.readFile(fullPath, {encoding: encoding})
				.then(newerFileContent => {
					const data = {};
					data[di.FILE_BODY] = newerFileContent;
					data[di.FILE_LOAD_TIME] = stat.mtime.getTime();
					return data;
				});
		});
}

function saveFileToStorage(relativePath, content, fileLoadTime) {
	return getJSFileFullPath(relativePath)
		.then(fullPath => {
			return saveJSFileInner(fullPath, content, fileLoadTime);
		});
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
		})
		.then(cacheStorageFiles);
}

function deleteItem(relativePath) {
	return getJSFileFullPath(relativePath)
		.then(fsx.deleteItem)
		.then(cacheStorageFiles);
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
	)
		.then(cacheStorageFiles);
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
	)
		.then(cacheStorageFiles);
}

function listDirItems(fullPath) {
	const dirItems = [];
	const fileItems = [];

	return fsx.readdir(fullPath)
		.then(items => {
			const promises = [];

			items.forEach(item => {
				const itemFullPath = path.join(fullPath, item);
				const promise = fsx.stat(itemFullPath)
					.then(itemStat => {
						if (itemStat.isDirectory()) {
							dirItems.push(item);
						}

						if (itemStat.isFile()) {
							fileItems.push(item);
						}
					});

				promises.push(promise);
			});

			return Promise.all(promises)
				.then(items => {
					return Promise.resolve({
						dirs: dirItems,
						files: fileItems
					});
				});
		});
}

function makeDirItem(item, relativePath, subDirItems) {
	return {
		label: item,
		items: subDirItems,
		icon: uiConsts.DIR_ICON,
		value: {
			relativePath: path.join(relativePath, item),
			label: item,
			mustLoadChildItems: false,
			isDir: true
		}
	};
}

function makeFileItem(item, relativePath) {
	return {
		label: item,
		icon: uiConsts.FILE_ICON,
		value: {
			relativePath: path.join(relativePath, item),
			label: item,
			mustLoadChildItems: false,
			isDir: false
		}
	};
}

function gatherAllFiles(relativePath) {
	relativePath = relativePath || '';
	relativePath = path.join(path.sep, relativePath);
	const searchFrom = path.join(confMgmt.getNexlStorageDir(), relativePath);

	if (!utils.isDirPathValid(searchFrom)) {
		logger.log.error(`Got unacceptable path [${searchFrom}]. This path is invalid or points outside a nexl JavaScript files root dir`);
		return Promise.reject('Unacceptable path');
	}

	const dirItems = [];
	return listDirItems(searchFrom)
		.then(currentDirItems => {

			// iterating over dir items and resolving sub dir items with promises
			const promises = [];
			currentDirItems.dirs.forEach(item => {
				const subDirRelativePath = path.join(relativePath, item);
				const promise = gatherAllFiles(subDirRelativePath)
					.then(subDirItems => {
						const dirItem = makeDirItem(item, relativePath, subDirItems);
						dirItems.push(dirItem);
					});
				promises.push(promise);
			});

			// running promises to resolve sub dir items
			return Promise.all(promises)
				.then(x => {
					dirItems.sort(sortFilesFunc);
					const fileItems = [];

					// now iterating over file items
					currentDirItems.files.forEach(item => {
						const fileItem = makeFileItem(item, relativePath);
						fileItems.push(fileItem);
					});

					fileItems.sort(sortFilesFunc);

					return Promise.resolve(dirItems.concat(fileItems));
				});
		});
}

function cacheStorageFiles() {
	const jsFilesRootDir = confMgmt.getNexlStorageDir();
	logger.log.info(`Caching files list in [${jsFilesRootDir}] directory`);

	return gatherAllFiles().then(
		(result) => {
			TREE_ITEMS = result;
			logger.log.debug(`Files are gathered`);
			return Promise.resolve();
		}
	);
}

// --------------------------------------------------------------------------------
module.exports.loadFileFromStorage = loadFileFromStorage;
module.exports.saveFileToStorage = saveFileToStorage;
module.exports.mkdir = mkdir;
module.exports.deleteItem = deleteItem;
module.exports.rename = rename;
module.exports.move = move;

module.exports.gatherAllFiles = gatherAllFiles;

module.exports.cacheStorageFiles = cacheStorageFiles;
module.exports.getTreeItems = () => TREE_ITEMS;
// --------------------------------------------------------------------------------
