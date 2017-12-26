const path = require('path');
const deepMerge = require('deepmerge');
const fs = require('fs');
const cmdLineArgs = require('./cmd-line-args');

function resolveFullPath(fileName) {
	return path.isAbsolute(fileName) ? fileName : path.join(cmdLineArgs.NEXL_HOME_DIR, fileName);
}

function save(dataObject, fileName) {
	var fullPath = resolveFullPath(fileName);
	var data = load(fullPath);
	data = deepMerge(data, dataObject);
	fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
}

function load(fileName) {
	var fullPath = resolveFullPath(fileName);
	if (!fs.existsSync(fullPath)) {
		return {};
	}

	var data = fs.readFileSync(fullPath);
	return JSON.parse(data);
}

function deleteSettingsFile(fileName) {
	var fullPath = resolveFullPath(fileName);
	if (fs.existsSync(fullPath)) {
		fs.unlinkSync(fullPath);
	}
}

// --------------------------------------------------------------------------------
module.exports.save = save;
module.exports.load = load;
module.exports.deleteSettingsFile = deleteSettingsFile;
// --------------------------------------------------------------------------------
