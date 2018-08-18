const path = require('path');
const j79 = require('j79-utils');

const fsx = require('./fsx');
const logger = require('./logger');
const confMgmt = require('./conf-mgmt');
const confConsts = require('../common/conf-constants');
const uiConsts = require('../common/ui-constants');
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

	const fullPath = path.join(confMgmt.getJSFilesRootDir(), relativePath || '');

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

	const fullPath = path.join(confMgmt.getJSFilesRootDir(), relativePath || '');

	if (!utils.isDirPathValid(fullPath)) {
		logger.log.error('The [%s] path is unacceptable', fullPath);
		return Promise.reject('Unacceptable path');
	}

	return Promise.resolve(fullPath);
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

					const encoding = confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.JS_FILES_ENCODING];
					return fsx.readFile(fullPath, {encoding: encoding});
				});
		}
	);
}

function saveJSFile(relativePath, content) {
	return getJSFileFullPath(relativePath).then(
		(fullPath) => {
			const encoding = confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.JS_FILES_ENCODING];
			return fsx.writeFile(fullPath, content, {encoding: encoding});
		}
	)
		.then(cacheJSFiles);
	/*
			.then( // updating cache
				() => {
					if (JS_FILES_CACHE.indexOf(relativePath) < 0) {
						JS_FILES_CACHE.push(relativePath);
					}

					JS_FILES_CACHE.sort();
				}
			);
	*/
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
		.then(cacheJSFiles);
}

function deleteItem(relativePath) {
	return getJSFileFullPath(relativePath)
		.then(fsx.deleteItem)
		.then(cacheJSFiles);
	/*
			.then(
				// updating cache
				() => {
					JS_FILES_CACHE.forEach(
						(item, index) => {
							if (item.indexOf(relativePath) === 0) {
								JS_FILES_CACHE.splice(index, 1);
							}
						}
					);
				}
			);
	*/
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
		.then(cacheJSFiles);
	/*
			.then(
				// updating cache
				() => {
					JS_FILES_CACHE.forEach(
						(item, index) => {
							if (item.indexOf(oldRelativePath) === 0) {
								JS_FILES_CACHE[index] = newRelativePath;
							}
						}
					);

					JS_FILES_CACHE.sort();

					return Promise.resolve();
				}
			);
	*/
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
		.then(cacheJSFiles);

	/*
				// updating cache
				() => {
					JS_FILES_CACHE.forEach(
						(item, index) => {
							if (item.indexOf(source) === 0) {
								const baseName = path.basename(source);
								JS_FILES_CACHE[index] = path.join(path.sep, dest, baseName);
							}
						}
					);

					JS_FILES_CACHE.sort();

					return Promise.resolve();
				}
	*/
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
	const searchFrom = path.join(confMgmt.getJSFilesRootDir(), relativePath);

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

function cacheJSFiles() {
	const jsFilesRootDir = confMgmt.getJSFilesRootDir();
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
module.exports.loadJSFile = loadJSFile;
module.exports.saveJSFile = saveJSFile;
module.exports.mkdir = mkdir;
module.exports.deleteItem = deleteItem;
module.exports.rename = rename;
module.exports.move = move;

module.exports.gatherAllFiles = gatherAllFiles;

module.exports.cacheJSFiles = cacheJSFiles;
module.exports.getTreeItems = () => TREE_ITEMS;
// --------------------------------------------------------------------------------
