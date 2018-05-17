const path = require('path');
const fs = require('fs');
const tmpDir = require('os').tmpdir();
const fsextra = require('fs-extra');
const version = require('./../package.json').version;


const workingDir = process.cwd();
const nexlHomeDir = path.join(workingDir, '.nexl');
const nexlSourcesDir = path.join(workingDir, 'nexl-sources');
process.argv.push(util.format('--%s=%s',cmdLineArgs.NEXL_HOME_DEF, nexlHomeDir ));

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
			NEXL_HOME_DIR: confMgmt.NEXL_HOME_DIR,
			NEXL_SOURCES_DIR: nexlSoucesDir
		});
	}
);