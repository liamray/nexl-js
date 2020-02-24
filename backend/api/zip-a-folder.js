'use strict';
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

function zipFolder(srcFolder, zipFilePath) {
	return new Promise((resolve, reject) => {
		fs.access(srcFolder, fs.constants.F_OK, (notExistingError) => {
			if (notExistingError) {
				reject(notExistingError);
				return;
			}
			fs.access(path.dirname(zipFilePath), fs.constants.F_OK, (notExistingError) => {
				if (notExistingError) {
					reject(notExistingError);
					return;
				}

				const output = fs.createWriteStream(zipFilePath);
				const zipArchive = archiver('zip');

				output.on('close', function () {
					resolve();
				});

				zipArchive.pipe(output);
				zipArchive.directory(srcFolder, false);
				zipArchive.finalize();
			});
		});

	});
}

module.exports = zipFolder;