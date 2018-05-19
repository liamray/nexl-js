const fs = require('fs');
const path = require('path');
const util = require('util');

const fsx = require('../../api/fsx');
const logger = require('../../api/logger');
const confMgmt = require('../../api/conf-mgmt');
const utils = require('../../api/utils');

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

function resolveFullPath(relativePath) {
	if (!utils.isPathValid(relativePath)) {
		logger.log.error('The [%s] path is unacceptable', relativePath);
		return Promise.reject('Unacceptable path');
	}

	return confMgmt.loadSettings().then(
		(settings) => {
			const fullPath = path.join(confMgmt.getNexlSourcesDir(), relativePath || '');
			if (!utils.isPathValid(fullPath)) {
				logger.log.error('The [%s] path is unacceptable', fullPath);
				return Promise.reject('Unacceptable path');
			}

			return Promise.resolve({
				fullPath: fullPath,
				settings: settings
			});
		}
	);
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

function assembleItemsPromised(relativePath, nexlSourcesDir, items) {
	return Promise.resolve().then(() => {
			let files = [];
			let dirs = [];
			const promises = [];

			// gathering promises
			for (let index in items) {
				let item = items[index];

				const itemRelativePath = path.join(relativePath, item);
				if (!utils.isPathValid(itemRelativePath)) {
					logger.log.error('The [%s] path is unacceptable', relativePath);
					return Promise.reject('Unacceptable path');
				}

				const fullPath = path.join(nexlSourcesDir, itemRelativePath);
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

function loadNexlSource(relativePath) {
	return resolveFullPath(relativePath).then(
		(stuff) => {
			const encoding = stuff.settings[confMgmt.SETTINGS.NEXL_SOURCES_ENCODING];
			return fsx.readFile(stuff.fullPath, {encoding: encoding});
		}
	);
}

function saveNexlSource(relativePath, content) {
	return resolveFullPath(relativePath).then(
		(stuff) => {
			const encoding = stuff.settings[confMgmt.SETTINGS.NEXL_SOURCES_ENCODING];
			return fsx.writeFile(stuff.fullPath, content, {encoding: encoding});
		}
	);
}

function listNexlSources(relativePath) {
	return resolveFullPath(relativePath).then(
		(stuff) => {
			return fsx.exists(confMgmt.getNexlSourcesDir()).then(
				(isExists) => {
					if (!isExists) {
						logger.log.error('The [%s] nexl source dir doesn\'t exist', confMgmt.getNexlSourcesDir());
						return Promise.reject('nexl sources dir doesn\'t exist !');
					} else {
						return fsx.readdir(stuff.fullPath).then(
							(items) => assembleItemsPromised(relativePath, confMgmt.getNexlSourcesDir(), items));
					}
				});
		}
	);
}

function mkdir(relativePath) {
	return resolveFullPath(relativePath).then(
		(stuff) => {
			return fsx.exists(stuff.fullPath).then((isExists) => {
				if (isExists) {
					return Promise.reject('Directory or file already exists');
				}

				return fsx.mkdir(stuff.fullPath);
			});
		});
}

function deleteItem(relativePath) {
	return resolveFullPath(relativePath).then(
		(stuff) => {
			return fsx.deleteItem(stuff.fullPath);
		});
}

function rename(relativePath, newRelativePath) {
	return resolveFullPath(newRelativePath).then(
		(newRelativePathStuff) => {
			return fsx.exists(newRelativePathStuff.fullPath).then(
				(isExists) => {
					if (isExists) {
						logger.log.error('Cannot rename a [%s] to [%s] because the [%s] already exists', relativePath, newRelativePath, newRelativePath);
						return Promise.reject('Item with the same name already exists');
					}

					return resolveFullPath(relativePath).then(
						(relativePathStuff) => {
							return fsx.rename(relativePathStuff.fullPath, newRelativePathStuff.fullPath);
						}
					);

				}
			);
		}
	);
}

function moveInner(sourceStuff, destStuff) {
	return fsx.exists(sourceStuff.fullPath).then(
		(isSrcExists) => {
			if (!isSrcExists) {
				logger.log.error('Failed to move a [%s] source item to [%s] destination item. Reason : source item doesn\'t exist', sourceStuff.fullPath, destStuff.fullPath);
				return Promise.reject('Source item doesn\'t exist');
			}

			const destItem = path.join(destStuff.fullPath, path.basename(sourceStuff.fullPath));

			return fsx.exists(destItem).then(
				(isDestExists) => {
					if (isDestExists) {
						logger.log.error('Failed to move a [%s] source item to [%s] destination item. Reason : destination item already exists', sourceStuff.fullPath, destItem);
						return Promise.reject('Destination item already exist');
					}

					// moving...
					return fsx.move(sourceStuff.fullPath, destItem);
				}
			);
		}
	);
}

function move(source, dest) {
	return resolveFullPath(source).then(
		(sourceStuff) => {
			return resolveFullPath(dest).then(
				(destStuff) => {
					return moveInner(sourceStuff, destStuff);
				}
			);
		}
	);
}

// --------------------------------------------------------------------------------
module.exports.listNexlSources = listNexlSources;
module.exports.loadNexlSource = loadNexlSource;
module.exports.saveNexlSource = saveNexlSource;
module.exports.mkdir = mkdir;
module.exports.deleteItem = deleteItem;
module.exports.rename = rename;
module.exports.move = move;
// --------------------------------------------------------------------------------
