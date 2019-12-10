const assert = require('assert');
const os = require('os');
const fs = require('fs');
const fsx = require('fs-extra');
const path = require('path');
const unzipper = require('unzipper');
const recursive = require("recursive-readdir");

const testAPI = require('../test-api');
const confConsts = require('../../backend/common/conf-constants');
const confMgmt = require('../../backend/api/conf-mgmt');
const storageUtil = require('../../backend/api/storage-utils');

const MAX_BACKUPS = 5;
const FILE_CNT = 8;

const storageBackupDir = path.join(os.tmpdir(), 'nexl-stroage-backup-test-' + Math.random());

// --------------------------------------------------------------------------------

function init(predefinedNexlJSFIlesDir, tmpNexlJSFilesDir) {
	confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.STORAGE_DIR] = predefinedNexlJSFIlesDir;
	confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.BACKUP_STORAGE_DIR] = storageBackupDir;
	confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.BACKUP_STORAGE_MAX_BACKUPS] = MAX_BACKUPS;

	return Promise.resolve();
}

function zipUnZipTestInner() {
	const files = fs.readdirSync(storageBackupDir);
	const zipFile = path.join(storageBackupDir, files[0]); // must only 1 file

	// unzipping
	return fs.createReadStream(zipFile)
		.pipe(unzipper.Extract({path: storageBackupDir}))
		.promise()
		.then(_ => recursive(storageBackupDir))
		.then((files, err) => {
			if (err) {
				return Promise.reject(err);
			}

			if (files.length !== FILE_CNT + 1) { // 1 for Zip itself
				return Promise.reject("Unzipped files count doesn't match");
			}

			fsx.removeSync(storageBackupDir);
			return Promise.resolve();
		});
}

function zipUnZipTest() {
	fs.mkdirSync(storageBackupDir);
	return storageUtil.backupStorage().then(zipUnZipTestInner);
}

function delay() {
	return new Promise((resolve, reject) => {
		console.log('Sleeping...');
		setTimeout(_ => {
			resolve();
		}, 1000);
	});
}

function maxBackupsTest() {
	fs.mkdirSync(storageBackupDir);
	return Promise.resolve()
		.then(storageUtil.backupStorage)
		.then(delay)

		.then(storageUtil.backupStorage)
		.then(delay)

		.then(storageUtil.backupStorage)
		.then(delay)

		.then(storageUtil.backupStorage)
		.then(delay)

		.then(storageUtil.backupStorage)
		.then(delay)

		.then(storageUtil.backupStorage)
		.then(delay)

		.then(storageUtil.backupStorage)
		.then(delay)

		.then(storageUtil.backupStorage)
		.then(delay)

		.then(storageUtil.backupStorage)
		.then(delay)

		.then(storageUtil.backupStorage)
		.then(delay)

		.then(storageUtil.backupStorage)
		.then(delay)

		.then(storageUtil.backupStorage)
		.then(delay)

		.then(storageUtil.backupStorage)
		.then(delay)

		.then(storageUtil.backupStorage)
		.then(delay)

		.then(_ => recursive(storageBackupDir))

		.then((files, err) => {
			fsx.removeSync(storageBackupDir);

			if (err) {
				return Promise.reject(err);
			}

			if (files.length !== MAX_BACKUPS) {
				return Promise.reject(`Backups count must be [${MAX_BACKUPS}], but got a [${files.length}] count`);
			}

			return Promise.resolve();
		})
}

function run() {
	return Promise.resolve()
		.then(zipUnZipTest)
		.then(maxBackupsTest);
}

function done() {
	return Promise.resolve();
}

testAPI.startNexlApp(init, run, done);