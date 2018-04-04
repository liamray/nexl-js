const fs = require('fs');
const fsx = require('../../api/fsx');
const logger = require('../../api/logger');
const path = require('path');
const util = require('util');

const confMgmt = require('../../api/conf-mgmt');
const INVLID_PATH_PATTERN = '((\\\\|/)\\.+(\\\\|/))|(^\\.{2,})|(\\.+$)';

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

function validateRelativePath(relativePath) {
	if (relativePath.search('((\\\\|/)\\.+(\\\\|/))|(^\\.{2,})|(\\.+$)') > -1) {
		throw 'Unacceptable path';
	}
}

function resolveFullPath(relativePath) {
	return new Promise((resolve, reject) => {
		if (relativePath.search(INVLID_PATH_PATTERN) > -1) {
			logger.log.error('The [%s] path is unacceptable', relativePath);
			reject('Unacceptable path');
			return;
		}

		// loading nexl source dir
		confMgmt.loadAsync(confMgmt.CONF_FILES.SETTINGS).then(
			(settings) => {
				const fullPath = path.join(settings[confMgmt.SETTINGS.NEXL_SOURCES_DIR], relativePath || '');
				if (fullPath.search(INVLID_PATH_PATTERN) > -1) {
					logger.log.error('The [%s] path is unacceptable', fullPath);
					reject('Unacceptable path');
					return;
				}

				resolve({
					fullPath: fullPath,
					settings: settings
				});
			}
		).catch(
			err => reject(err)
		);
	});
}

function assembleItemsPromised(relativePath, nexlSourcesDir, items) {
	return new Promise((resolve, reject) => {

	});
}

function assembleItems(relativePath, nexlSourcesDir, items) {
	let files = [];
	let dirs = [];

	items.forEach(function (name) {
		const itemRelativePath = path.join(relativePath, name);
		validateRelativePath(itemRelativePath);

		const fullPath = path.join(nexlSourcesDir, itemRelativePath);

		const item = {
			label: name,
			value: {
				relativePath: itemRelativePath
			}
		};

		// is directory ?
		if (fs.statSync(fullPath).isDirectory()) {
			item.value.mustLoadChildItems = true;
			item.value.isDir = true;
			item.items = CHILD_ITEM.slice();
			dirs.push(item);
			return;
		}

		// is file ?
		if (fs.statSync(fullPath).isFile()) {
			item.value.mustLoadChildItems = false;
			item.value.isDir = false;
			files.push(item);
			return;
		}
	});

	// sorting files and dirs
	files = files.sort(sortFilesFunc);
	dirs = dirs.sort(sortFilesFunc);

	return [].concat(dirs).concat(files);
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
			return fsx.readdir(stuff.fullPath).then(
				(items) => {
					items = assembleItems(relativePath, stuff.settings[confMgmt.SETTINGS.NEXL_SOURCES_DIR], items);
					return Promise.resolve(items);
				}
			)
		});
}

// --------------------------------------------------------------------------------
module.exports.getNexlSources = getNexlSources;
module.exports.getSourceContent = getSourceContent;
// --------------------------------------------------------------------------------
