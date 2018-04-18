const fs = require('fs');
const path = require('path');
const util = require('util');

const fsx = require('../../api/fsx');
const logger = require('../../api/logger');
const confMgmt = require('../../api/conf-mgmt');
const utils = require('../../api/utils');

const INVALID_PATH_PATTERN = '((\\\\|/)\\.+(\\\\|/))|(^\\.{2,})|(\\.+$)';

function isPathValid(relativePath) {
	return relativePath.search(INVALID_PATH_PATTERN) < 0;
}


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
	if (!isPathValid(relativePath)) {
		logger.log.error('The [%s] path is unacceptable', relativePath);
		return Promise.reject('Unacceptable path');
	}

	return Promise.resolve(confMgmt.CONF_FILES.SETTINGS).then(confMgmt.loadAsync)
		.then(
			(settings) => {
				const fullPath = path.join(settings[confMgmt.SETTINGS.NEXL_SOURCES_DIR], relativePath || '');
				if (!isPathValid(fullPath)) {
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
				if (!isPathValid(itemRelativePath)) {
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
							dirs.push(makeFileItem(item, itemRelativePath));
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

function getSourceContent(relativePath) {
	return resolveFullPath(relativePath).then(
		(stuff) => {
			const nexlSourcesRootDir = stuff.settings[confMgmt.SETTINGS.NEXL_SOURCES_DIR];
			const fullPath = path.join(nexlSourcesRootDir, relativePath);
			const encoding = stuff.settings[confMgmt.SETTINGS.NEXL_SOURCES_ENCODING];
			return fsx.readFile(stuff.fullPath, {encoding: encoding});
		}
	);
}

function getNexlSources(relativePath) {
	return resolveFullPath(relativePath).then(
		(stuff) => {
			return fsx.exists(stuff.settings[confMgmt.SETTINGS.NEXL_SOURCES_DIR]).then((isExists) => {
				if (!isExists) {
					logger.log.error('The [%s] nexl source dir doesn\'t exist', stuff.settings[confMgmt.SETTINGS.NEXL_SOURCES_DIR]);
					return Promise.reject('nexl sources dir doesn\'t exist !');
				} else {
					return fsx.readdir(stuff.fullPath).then(
						(items) => assembleItemsPromised(relativePath, stuff.settings[confMgmt.SETTINGS.NEXL_SOURCES_DIR], items));
				}
			});
		}
	);
}

function mkdir(relativePath) {
	return resolveFullPath(relativePath).then(
		(stuff) => {
			return fsx.mkdir(stuff.fullPath);
		});
}

function deleteItem(relativePath) {
	return resolveFullPath(relativePath).then(
		(stuff) => {
			return fsx.deleteItem(stuff.fullPath);
		});
}

// --------------------------------------------------------------------------------
module.exports.getNexlSources = getNexlSources;
module.exports.getSourceContent = getSourceContent;
module.exports.mkdir = mkdir;
module.exports.deleteItem = deleteItem;
// --------------------------------------------------------------------------------
