const assert = require('assert');
const os = require('os');
const fs = require('fs');
const fsx = require('fs-extra');
const path = require('path');

const testAPI = require('../test-api');
const confConsts = require('../../backend/common/conf-constants');
const confMgmt = require('../../backend/api/conf-mgmt');
const security = require('../../backend/api/security');
const securityConsts = require('../../backend/common/security-constants');
const storageUtil = require('../../backend/api/storage-utils');

const storageBackupDir = path.join(os.tmpdir(), 'nexl-stroage-backup-test-' + Math.random());

// --------------------------------------------------------------------------------

function init(predefinedNexlJSFIlesDir, tmpNexlJSFilesDir) {
	confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.STORAGE_DIR] = predefinedNexlJSFIlesDir;
	fs.mkdirSync(storageBackupDir);
	confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.BACKUP_STORAGE_DIR] = storageBackupDir;

	return Promise.resolve();
}

function run() {
	return storageUtil.backupStorage().then(
		_ => {
			console.log('Ok');
			return Promise.resolve();
		}
	).catch(_ => {
		console.log('Bad');
		return Promise.reject();
	});
}

function done() {
	fsx.removeSync(storageBackupDir);
	return Promise.resolve();
}

testAPI.startNexlApp(init, run, done);