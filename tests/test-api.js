const path = require('path');
const os = require('os');
const fs = require('fs');
const fsextra = require('fs-extra');

const nexlApp = require('../backend/nexl-app/nexl-app');
const confConsts = require('../backend/common/conf-constants');
const confMgmt = require('../backend/api/conf-mgmt');

const TEST_HOST = 'localhost';
const TEST_PORT = 8989;

// --------------------------------------------------------------------------------

function printLongDash() {
	console.log('-----------------------------------------------------------------------------------');
}

function startNexlApp(initTest, runTests, finalizeTests) {
	// recreating tmp nexl home dir
	const tmpNexlHomeDir = path.join(os.tmpdir(), '.nexl');
	fsextra.removeSync(tmpNexlHomeDir);
	fs.mkdirSync(tmpNexlHomeDir);

	// recreating tmp nexl storage files dir
	const tmpNexlStorageDir = path.join(os.tmpdir(), 'nexl-storage');
	fsextra.removeSync(tmpNexlStorageDir);
	fs.mkdirSync(tmpNexlStorageDir);

	// setting up nexl home dir in process args
	process.argv.push(`--${confConsts.NEXL_HOME_DEF}=${tmpNexlHomeDir}`);

	return nexlApp.create()
		.then(_ => {
			const predefinedNexlStorageDir = path.join(__dirname, 'resources/storage');

			const settings = confMgmt.getNexlSettingsCached();
			settings[confConsts.SETTINGS.HTTP_BINDING] = TEST_HOST;
			settings[confConsts.SETTINGS.HTTP_PORT] = TEST_PORT;

			return initTest(predefinedNexlStorageDir, tmpNexlStorageDir);
		})
		.then(nexlApp.start)
		.then(runTests)
		.then(finalizeTests)
		.then(_ => {
			printLongDash();
			console.log('All tests are passed !!!');
			printLongDash();
			nexlApp.stop();
		})
		.catch(err => {
			printLongDash();
			console.log('Tests are failed :(');

			if (err !== undefined) {
				console.log('Reason :');
				printLongDash();
				console.log(err);
				printLongDash();
			} else {
				printLongDash();
			}

			nexlApp.stop();
		});
}

// --------------------------------------------------------------------------------
module.exports.startNexlApp = startNexlApp;
module.exports.TEST_HOST = TEST_HOST;
module.exports.TEST_PORT = TEST_PORT;
// --------------------------------------------------------------------------------