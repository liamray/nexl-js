'use strict';
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

function zipFolder(srcFolder, zipFilePath, callback) {
	// folder double check
	fs.access(srcFolder, fs.constants.F_OK, (notExistingError) => {
		if (notExistingError) {
			return callback(notExistingError);
		}
		fs.access(path.dirname(zipFilePath), fs.constants.F_OK, (notExistingError) => {
			if (notExistingError) {
				return callback(notExistingError);
			}

			const output = fs.createWriteStream(zipFilePath);
			const zipArchive = archiver('zip');

			output.on('close', function () {
				callback();
			});

			zipArchive.pipe(output);
			zipArchive.directory(srcFolder, false);
			zipArchive.finalize();
		});
	});
}

module.exports = zipFolder;