'use strict';
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

function isExist(resource) {
	return new Promise((resolve, reject) => {
		fs.access(resource, fs.constants.F_OK, (notExistingError) => {
			if (notExistingError) {
				reject(notExistingError);
			} else {
				resolve();
			}
		});
	});
}

function zipFolder(srcFolders, zipFilePath) {
	const promises = [];
	srcFolders.forEach(srcFolder => {
		promises.push(isExist(srcFolder));
	});

	promises.push(isExist(path.dirname(zipFilePath)));

	return Promise.all(promises)
		.then(() => {
			return new Promise((resolve, reject) => {
				const output = fs.createWriteStream(zipFilePath);
				const zipArchive = archiver('zip');

				zipArchive.on('error', function (err) {
					reject(err);
				});

				output.on('close', function () {
					resolve();
				});

				zipArchive.pipe(output);
				srcFolders.forEach(srcFolder => zipArchive.directory(srcFolder, true));
				zipArchive.finalize();
			});
		});
}

module.exports = zipFolder;
