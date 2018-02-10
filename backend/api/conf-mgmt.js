const path = require('path');
const deepMerge = require('deepmerge');
const fs = require('fs');
const util = require('util');

const cmdLineArgs = require('./cmd-line-args');
const utils = require('./utils');
const security = require('./security');
const logger = require('./logger');

const CONF_FILES = {
	SETTINGS: 'settings.js', // general settings
	TOKENS: 'tokens.js', // tokens to register a user and reset password
	PASSWORDS: 'passwords.js', // password for login
	ADMINS: 'admins.js', // administrators list
	GROUPS: 'groups.js', // logical groups
	PERMISSIONS: 'permissions.js' // permissions matrix
};

function resolveNexlHomeDir() {
	return cmdLineArgs.NEXL_HOME_DIR;
}

function resolveFullPath(fileName) {
	return path.isAbsolute(fileName) ? fileName : path.join(resolveNexlHomeDir(), fileName);
}

function save(dataObject, fileName) {
	const fullPath = resolveFullPath(fileName);
	let data = load(fullPath);
	data = deepMerge(data, dataObject);
	fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
}

function load(fileName) {
	const fullPath = resolveFullPath(fileName);
	if (!fs.existsSync(fullPath)) {
		return {};
	}

	const data = fs.readFileSync(fullPath);
	return JSON.parse(data);
}

function deleteConfFile(fileName) {
	const fullPath = resolveFullPath(fileName);
	if (fs.existsSync(fullPath)) {
		fs.unlinkSync(fullPath);
	}
}

function createNexlHomeDirIfNeeded() {
	// do not use logger in this function because it's not initialized yet !
	const nexlHomeDir = resolveNexlHomeDir();

	// is nexl home dir exists ?
	if (!fs.existsSync(nexlHomeDir)) {
		console.log('Creating [%s] nexl home directory', nexlHomeDir);
		fs.mkdirSync(nexlHomeDir);
		return;
	}

	// is nexl home dir is a real dir ?
	if (!fs.lstatSync(nexlHomeDir).isDirectory()) {
		throw util.format('The [%s] nexl home directory points to existing file. Recreate it as a directory or use another nexl home directory in the following way :\nnexl --nexl-home=/path/to/nexl/home/directory', nexlHomeDir);
	}
}

function initNexlHomeDir() {
	const nexlHomeDir = resolveNexlHomeDir();

	// if one of the following files exist, don't do anything
	const confFiles = [CONF_FILES.TOKENS, CONF_FILES.PASSWORDS, CONF_FILES.ADMINS, CONF_FILES.PERMISSIONS];

	// iterating and checking
	for (let item in confFiles) {
		const confFile = path.join(nexlHomeDir, confFiles[item]);
		if (fs.existsSync(confFile)) {
			return;
		}
	}

	// creating default files

	// 1) creating permissions.js file with unauthorized user which
	const permission = {};
	permission[utils.UNAUTHORIZED_USERNAME] = {
		read: true,
		write: true
	};
	save(permission, CONF_FILES.PERMISSIONS);

	// 2) generating admin token
	const token = security.generateToken(utils.ADMIN_USERNAME);
	const tokens = {
		tokens: [token]
	};
	save(tokens, CONF_FILES.TOKENS);
	logger.log.info('Use the following token to register an [%s] user : [%s]', utils.ADMIN_USERNAME, token);

	// 3) adding admin to admins group
	const admins = {
		admins: [utils.ADMIN_USERNAME]
	};
	save(admins, CONF_FILES.ADMINS);
}


// --------------------------------------------------------------------------------
module.exports.CONF_FILES = CONF_FILES;

module.exports.save = save;
module.exports.load = load;
module.exports.deleteConfFile = deleteConfFile;

module.exports.resolveNexlHomeDir = resolveNexlHomeDir;
module.exports.createNexlHomeDirIfNeeded = createNexlHomeDirIfNeeded;
module.exports.initNexlHomeDir = initNexlHomeDir;
// --------------------------------------------------------------------------------
