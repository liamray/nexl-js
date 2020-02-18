const path = require('path');
const fs = require('fs');
const zipFolder = require('./zip-a-folder');
const CronJob = require('cron').CronJob;

const fsx = require('./fsx');
const logger = require('./logger');
const confMgmt = require('./conf-mgmt');
const confConsts = require('../common/conf-constants');
const uiConsts = require('../common/ui-constants');
const di = require('../common/data-interchange-constants');
const resolveSearchFunc = require('../common/find-in-files');
const utils = require('./utils');
const commonUtils = require('../common/common-utils');
const webhooks = require('./webhooks');

// todo : allow to configure
const MAX_FIND_IN_FILES_OCCURRENCES = 1000;

// files and directories manipulation actions ( applying in webhooks )
const ACTION_UPDATE = 'update';
const ACTION_DELETE = 'delete';
const ACTION_RENAME = 'rename';
const ACTION_MOVE = 'move';

const BACKUP_ZIP_PATTERN = 'nexl-storage-backup';
const BACKUP_ZIP_REGEX_PATTERN = new RegExp(BACKUP_ZIP_PATTERN + '-\\d{4}-\\d{1,2}-\\d{1,2}--\\d{1,2}-\\d{1,2}-\\d{1,2}-\\d{1,3}\.zip');

let TREE_ITEMS = [];
let job;

function sortFilesFunc(a, b) {
	if (a.label.toUpperCase() > b.label.toUpperCase()) {
		return 1;
	}
	if (a.label.toUpperCase() < b.label.toUpperCase()) {
		return -1;
	}
	return 0;
}

function assembleStorageFilePath(relativePath) {
	if (!utils.isFilePathValid(relativePath)) {
		return Promise.reject(`The [${relativePath}] path is unacceptable ( probably it points outside the nexl storage directory )`);
	}

	const fullPath = path.join(confMgmt.getNexlStorageDir(), relativePath || '');

	if (!utils.isFilePathValid(fullPath)) {
		return Promise.reject(`The [${relativePath}] path is unacceptable ( probably it points outside the nexl storage directory )`);
	}

	return Promise.resolve(fullPath);
}

function assembleStorageDirPath(relativePath) {
	if (!utils.isDirPathValid(relativePath)) {
		return Promise.reject(`The [${relativePath}] path is unacceptable ( probably it points outside the nexl storage directory )`);
	}

	const fullPath = path.join(confMgmt.getNexlStorageDir(), relativePath || '');

	if (!utils.isDirPathValid(fullPath)) {
		return Promise.reject(`The [${relativePath}] path is unacceptable ( probably it points outside the nexl storage directory )`);
	}

	return Promise.resolve(fullPath);
}

function loadFileFromStorage(relativePath) {
	return assembleStorageFilePath(relativePath).then(
		(fullPath) => {
			return fsx.exists(fullPath).then(
				(isExists) => {
					if (!isExists) {
						return Promise.reject(`Cannot load the [${fullPath}] JavaScript file. Reason: file doens't exist`);
					}

					const encoding = confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.STORAGE_FILES_ENCODING];
					return fsx.readFile(fullPath, {encoding: encoding});
				});
		}
	);
}

function wrapWebhook(relativePath, action) {
	return {
		relativePath: relativePath,
		action: action
	};
}

function saveFileToStorageInnerInner(fullPath, relativePath, content) {
	const data = {};

	const encoding = confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.STORAGE_FILES_ENCODING];

	return fsx.writeFile(fullPath, content, {encoding: encoding})
		.then(webhooks.fireWebhooks(wrapWebhook(relativePath, ACTION_UPDATE)))
		.then(_ => fsx.stat(fullPath))
		.then(stat => Promise.resolve(data[di.FILE_LOAD_TIME] = stat.mtime.getTime()))
		.then(cacheStorageFiles)
		.then(_ => data);
}

function saveFileToStorageInner(fullPath, relativePath, content, fileLoadTime) {
	if (fileLoadTime === undefined) {
		return saveFileToStorageInnerInner(fullPath, relativePath, content);
	}

	// comparing fileLoadTime to last file modification time
	return fsx.stat(fullPath)
		.then(stat => {
			if (fileLoadTime >= stat.mtime.getTime()) {
				// file was modified on server before the fileLoadTime, just saving...
				return saveFileToStorageInnerInner(fullPath, relativePath, content);
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
	return assembleStorageFilePath(relativePath)
		.then(fullPath => {
			return saveFileToStorageInner(fullPath, relativePath, content, fileLoadTime);
		});
}

function mkdir(relativePath) {
	return assembleStorageFilePath(relativePath).then(
		(fullPath) => {
			return fsx.exists(fullPath).then((isExists) => {
				if (isExists) {
					return Promise.reject(`The [${fullPath}] directory or file already exists`);
				}

				return fsx.mkdir(fullPath);
			});
		})
		.then(webhooks.fireWebhooks(wrapWebhook(relativePath, ACTION_UPDATE)))
		.then(cacheStorageFiles);
}

function deleteItem(relativePath) {
	return assembleStorageFilePath(relativePath)
		.then(fsx.deleteItem)
		.then(webhooks.fireWebhooks(wrapWebhook(relativePath, ACTION_DELETE)))
		.then(cacheStorageFiles);
}

function rename(oldRelativePath, newRelativePath) {
	return assembleStorageFilePath(newRelativePath).then(
		(newFullPath) => {
			return fsx.exists(newFullPath).then(
				(isExists) => {
					if (isExists) {
						return Promise.reject(`Cannot rename a [${oldRelativePath}] to [${newRelativePath}] because the [${newRelativePath}] already exists`);
					}

					return assembleStorageFilePath(oldRelativePath).then(
						(oldFullPath) => {
							return fsx.rename(oldFullPath, newFullPath);
						}
					);

				}
			);
		}
	)
		.then(webhooks.fireWebhooks(wrapWebhook(oldRelativePath, ACTION_RENAME)))
		.then(cacheStorageFiles);
}

function moveInner(sourceStuff, destStuff) {
	return fsx.exists(sourceStuff).then(
		(isSrcExists) => {
			if (!isSrcExists) {
				return Promise.reject(`Failed to move a [${sourceStuff}] source item to [${destStuff}] destination item. Reason : source item doesn't exist`);
			}

			const destItem = path.join(destStuff, path.basename(sourceStuff));

			return fsx.exists(destItem).then(
				(isDestExists) => {
					if (isDestExists) {
						return Promise.reject(`Failed to move a [${sourceStuff}] source item to [${destItem}] destination item. Reason : destination item already exists`);
					}

					// moving...
					return fsx.move(sourceStuff, destItem);
				}
			);
		}
	);
}

function move(source, dest) {
	const data = {};
	return assembleStorageFilePath(source)
		.then(sourceFullPath => Promise.resolve(data.sourceFullPath = sourceFullPath))
		.then(_ => assembleStorageDirPath(dest))
		.then(destFullPath => Promise.resolve(data.destFullPath = destFullPath))
		.then(_ => moveInner(data.sourceFullPath, data.destFullPath))
		.then(webhooks.fireWebhooks(wrapWebhook(source, ACTION_MOVE)))
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
		return Promise.reject(`The [${searchFrom}] path is unacceptable ( probably it points outside the nexl storage directory )`);
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
	const storageDir = confMgmt.getNexlStorageDir();
	logger.log.debug(`Caching files list in [${storageDir}] directory`);

	return gatherAllFiles().then(
		(result) => {
			TREE_ITEMS = result;
			logger.log.debug(`Files are gathered`);
			return Promise.resolve();
		}
	);
}

function shredStorageBackups(dir, maxStorageBackups, resolve, reject) {
	// is unlimited ?
	if (maxStorageBackups === undefined || maxStorageBackups === null || maxStorageBackups === '' || maxStorageBackups === 0) {
		logger.log.debug(`The [${confConsts.SETTINGS.AUTOMATIC_BACKUP_MAX_BACKUPS}] is not specified, not shredding a storage backup in the [${dir}] dir`);
		resolve();
		return;
	}

	// reading files list
	fs.readdir(dir, function (err, files) {
		if (err) {
			logger.log.error(`Failed to read files list in [${dir}] directory. Reason: [${utils.formatErr(err)}]`);
			reject();
			return;
		}

		// filtering and sorting
		const zipFiles = files.filter(item => item.match(BACKUP_ZIP_REGEX_PATTERN)).sort();

		// checking count
		if (zipFiles.length < maxStorageBackups) {
			logger.log.debug(`Not shredding a storage backup in the [${dir}] dir. Reason: the [zipFilesCount=${zipFiles.length}] is less than [BACKUP_STORAGE_MAX_BACKUPS=${maxStorageBackups}]`);
			resolve();
			return;
		}

		// shredding first files
		let isSuccess = true;
		for (let index = 0; index < zipFiles.length - maxStorageBackups; index++) {
			const fileName = path.join(dir, zipFiles[index]);
			logger.log.info(`Shredding a [${fileName}] backup file`);
			fs.unlink(fileName, function (err) {
				if (err) {
					isSuccess = false;
					logger.log.error(`Failed to shred a [${fileName}]. Reason: [${utils.formatErr(err)}]`);
				}
			});
		}

		if (isSuccess) {
			resolve();
		} else {
			reject();
		}
	});
}

// todo: 1) this method 2) shredding method 3) fix tests
function backupStorage() {
	const destDir = confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.AUTOMATIC_BACKUP_DEST_DIR];
	const maxStorageBackups = confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.AUTOMATIC_BACKUP_MAX_BACKUPS];

	return new Promise((resolve, reject) => {
		const storageDir = confMgmt.getNexlStorageDir();
		if (utils.isEmptyStr(destDir)) {
			reject('The BACKUP_STORAGE_DIR is not specified, skipping storage backup');
			return;
		}

		const now = new Date();
		const destZipFile = path.join(destDir, `${BACKUP_ZIP_PATTERN}-${commonUtils.formatDate(now, '-')}--${commonUtils.formatTimeMSec(now, '-')}.zip`);

		logger.log.log('verbose', `Backing up a [${storageDir}] directory as a [${destZipFile}] file`);
		zipFolder(storageDir, destZipFile, function (err) {
			if (err) {
				logger.log.error('Failed to backup the storage. Reason: [%s]', utils.formatErr(err));
				reject(err);
				return;
			}

			logger.log.debug(`Successfully backed up a [${storageDir}] dir as a [${destZipFile}]`);
			shredStorageBackups(destDir, maxStorageBackups, resolve, reject);
		});
	});
}

function stopStorageBackupIfNeeded() {
	if (job !== undefined) {
		job.stop();
	}
}

function scheduleStorageBackup() {
	// preparing
	const settings = confMgmt.getNexlSettingsCached();
	const cronExpression = settings[confConsts.SETTINGS.AUTOMATIC_BACKUP_CRON_EXPRESSION];
	const destDir = settings[confConsts.SETTINGS.AUTOMATIC_BACKUP_DEST_DIR];

	// stopping previous job is scheduled
	stopStorageBackupIfNeeded();

	// is backup storage enabled ?
	const automaticBackupEnabled = confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.AUTOMATIC_BACKUP_ENABLED];
	if (automaticBackupEnabled !== true) {
		logger.log.debug('Automatic storage backup is not enabled');
		return Promise.resolve();
	}

	// is cron expression specified ?
	if (utils.isEmptyStr(cronExpression)) {
		logger.log.log('verbose', 'Not starting automatic storage backup. Reason: cron expression is not specified');
		return Promise.resolve();
	}

	// is dest dir specified ?
	if (utils.isEmptyStr(destDir)) {
		logger.log.log('verbose', 'Not starting automatic storage backup. Reason: backup output dir is not specified');
		return Promise.resolve();
	}

	// is there something to backup ?
	if (settings[confConsts.SETTINGS.AUTOMATIC_BACKUP_STORAGE] !== true && settings[confConsts.SETTINGS.AUTOMATIC_BACKUP_NEXL_SETTINGS] !== true) {
		logger.log.log('verbose', 'Not starting automatic storage backup. Reason: not specified what is to backup');
		return Promise.resolve();
	}

	// scheduling
	try {
		logger.log.info(`Scheduling an automatic storage backup according to the [${cronExpression}] cron expression to the [${destDir}] directory`);

		job = new CronJob('0 ' + cronExpression, function () {
			backupStorage();
		});
		job.start();
	} catch (e) {
		logger.log.error(e);
		return Promise.reject(`Failed to schedule a backup. Reason: [${utils.formatErr(e)}]`);
	}

	return Promise.resolve();
}

function gatherFilesList(list, root) {
	for (let index in root) {
		const item = root[index];
		if (item.value.isDir === true) {
			gatherFilesList(list, item.items);
			continue;
		}

		list.push(item.value.relativePath);
	}
}

function findInFiles(searchData) {
	const filesList = [];
	const subDir = findSubDir(searchData[di.RELATIVE_PATH]);
	gatherFilesList(filesList, subDir);

	const searchFunctionData = resolveSearchFunc(searchData);
	searchFunctionData.maxOccurrences = MAX_FIND_IN_FILES_OCCURRENCES;

	const result = {};
	const promises = [];
	let maxOccurrences = MAX_FIND_IN_FILES_OCCURRENCES;

	filesList.forEach(fileName => {
		const fullPath = path.join(confMgmt.getNexlStorageDir(), fileName);

		if (maxOccurrences < 0) {
			return;
		}

		const promise = fsx.readFile(fullPath, {encoding: confConsts.ENCODING_UTF8}).then(fileContent => {

			if (maxOccurrences < 0) {
				return;
			}

			searchFunctionData.fileContent = fileContent;
			const occurrences = searchFunctionData.func(searchFunctionData);
			if (occurrences.length > 0) {
				maxOccurrences--;
				result[fileName] = occurrences;
			}
		});
		promises.push(promise);
	});

	return Promise.all(promises).then(_ => Promise.resolve(result));
}

function findDir(dir, dirName) {
	for (let key in dir) {
		let item = dir[key];

		if (item.value.isDir !== true) {
			continue;
		}

		if (item.value.label === dirName) {
			return item;
		}
	}
}

function findSubDir(relativePath) {
	let normalizedPath = path.normalize(relativePath || '');

	// is root dir ?
	if (normalizedPath === path.sep || normalizedPath === '.') {
		return TREE_ITEMS;
	}

	// trimming slashes
	normalizedPath = normalizedPath.replace(/^[\\/]+|[\\/]+$/g, '');

	// searching for target dir
	const pathItems = normalizedPath.split(path.sep);
	let dir = TREE_ITEMS;

	for (let index in pathItems) {
		dir = findDir(dir, pathItems[index]);

		// relativePath doesn't exist
		if (dir === undefined) {
			return Promise.resolve({});
		}

		dir = dir.items;
	}

	return dir;
}

function listFiles(relativePath) {
	const subDir = findSubDir(relativePath);
	const result = [];
	subDir.forEach(item => {
		if (item === undefined) {
			return;
		}
		if (item.value.isDir !== true) {
			result.push(item.value.label);
		}
	});

	return result;
}

function listDirs(relativePath) {
	const subDir = findSubDir(relativePath);
	const result = [];
	subDir.forEach(item => {
		if (item === undefined) {
			return;
		}

		if (item.value.isDir === true) {
			result.push(item.value.label);
		}
	});

	return result;
}

function listDirsAndFiles(relativePath) {
	const subDir = findSubDir(relativePath);
	const result = [];
	subDir.forEach(item => {
		if (item === undefined) {
			return;
		}

		result.push(item.value.label);
	});

	return result;
}

// --------------------------------------------------------------------------------
module.exports.loadFileFromStorage = loadFileFromStorage;
module.exports.saveFileToStorage = saveFileToStorage;
module.exports.mkdir = mkdir;
module.exports.deleteItem = deleteItem;
module.exports.rename = rename;
module.exports.move = move;
module.exports.findInFiles = findInFiles;

module.exports.scheduleStorageBackup = scheduleStorageBackup;
module.exports.backupStorage = backupStorage;

module.exports.listFiles = listFiles;
module.exports.listDirs = listDirs;
module.exports.listDirsAndFiles = listDirsAndFiles;

module.exports.gatherAllFiles = gatherAllFiles;

module.exports.cacheStorageFiles = cacheStorageFiles;
module.exports.getTreeItems = () => TREE_ITEMS;
// --------------------------------------------------------------------------------
