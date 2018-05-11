const path = require('path');
const fs = require('fs');
const tmpDir = require('os').tmpdir();
const fsextra = require('fs-extra');
const version = require('./../package.json').version;


const nexlHomeDir = path.join(tmpDir, '.nexl');
const nexlSoucesDir = path.join(tmpDir, 'nexl-sources');

process.argv.push('--nexl-home=' + nexlHomeDir);

// recreating nexl home dir
if (fs.existsSync(nexlHomeDir)) {
	fsextra.removeSync(nexlHomeDir);
}
fs.mkdirSync(nexlHomeDir);


// creating nexl source dir
if (fs.existsSync(nexlSoucesDir)) {
	fsextra.removeSync(nexlSoucesDir);
}
fs.mkdirSync(nexlSoucesDir);

// todo : replace with original confMgmg promised
	const confMgmt = require('../backend/api/conf-mgmt');
	const conf = {
		version: version,
		data: {}
	};
	conf.data[confMgmt.SETTINGS.NEXL_SOURCES_DIR] = nexlSoucesDir;
	const settingsFile = path.join(nexlHomeDir, confMgmt.CONF_FILES.SETTINGS);
	// updating nexl source dir in settings
	fs.writeFileSync(settingsFile, JSON.stringify(conf, null, 2), confMgmt.ENCODING_UTF8);

console.log('nexl home dir is [%s]', confMgmt.NEXL_HOME_DIR);
console.log('nexl sources dir is [%s]', nexlSoucesDir);

module.exports = require('../backend/api/logger').init().then(
	() => {
		return Promise.resolve({
			NEXL_SOURCES_DIR: nexlSoucesDir,
			NEXL_HOME_DIR: nexlHomeDir
		});
	}
);


