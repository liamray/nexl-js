const path = require('path');
const os = require('os');
const fs = require('fs');
const fsextra = require('fs-extra');

const nexlApp = require('../backend/nexl-app/nexl-app');
const confConsts = require('../backend/common/conf-constants');

// --------------------------------------------------------------------------------

function printLongDash() {
	console.log('-----------------------------------------------------------------------------------');
}

function startNexlApp(initTest, runTests, finalizeTests) {
	// recreating tmp nexl home dir
	const tmpNexlHomeDir = path.join(os.tmpdir(), '.nexl');
	fsextra.removeSync(tmpNexlHomeDir);
	fs.mkdirSync(tmpNexlHomeDir);

	// recreating tmp nexl js files dir
	const tmpNexlJSFilesDir = path.join(os.tmpdir(), 'nexl-js-files');
	fsextra.removeSync(tmpNexlJSFilesDir);
	fs.mkdirSync(tmpNexlJSFilesDir);

	// setting up nexl home dir in process args
	process.argv.push(`--${confConsts.NEXL_HOME_DEF}=${tmpNexlHomeDir}`);

	return nexlApp.create()
		.then(_ => {
			const predefinedNexlJSFIlesDir = path.join(__dirname, 'resources/nexl-js-files-4-tests');
			initTest(predefinedNexlJSFIlesDir, tmpNexlJSFilesDir);
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
// --------------------------------------------------------------------------------