const commandLineArgs = require('command-line-args');
const util = require('util');
const version = require('./../../package.json').version;
const osHomeDir = require('os-homedir');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

const DEFAULT_NEXL_HOME_DIR = '.nexl';

var cmdLineOpts;

const CMD_LINE_OPTS_DEF = [
	{
		name: 'nexl-home',
		alias: 'n',
		type: String,
		desc: 'nexl home directory is where nexl stores all its settings ( [${HOME}/.nexl] is a default value )'
	},
	{
		name: 'version',
		alias: 'v',
		type: Boolean,
		desc: 'Displays product version'
	},
	{
		name: 'help',
		alias: 'h',
		type: Boolean
	}
];


function printHelp() {
	console.log('Available command line options are :');

	var maxLen = 0;
	// discovering length of longest option
	for (var item in CMD_LINE_OPTS_DEF) {
		// length
		var item = CMD_LINE_OPTS_DEF[item];
		maxLen = Math.max(maxLen, item.name.length);
	}

	for (var index in CMD_LINE_OPTS_DEF) {
		var item = CMD_LINE_OPTS_DEF[index];
		var spaces = maxLen - item.name.length + 1;
		spaces = Array(spaces).join(' ');
		var text;
		if (item.alias) {
			text = util.format("\t-%s, --%s %s %s", item.alias, item.name, spaces, item.desc);
		} else {
			text = util.format("\t--%s     %s %s", item.name, spaces, item.desc);
		}
		console.log(text);
	}


	// example
	console.log('\nFor example :\n\tnexl --nexl-home=c:\\nexl-instance-2');
}

function handleArgs() {
	try {
		cmdLineOpts = commandLineArgs(CMD_LINE_OPTS_DEF);
	} catch (e) {
		console.log('Wrong command line options');
		printHelp();
		throw e;
	}

	// is print version ?
	if (cmdLineOpts.version) {
		console.log('nexl-js version is [%s]', version);
		process.exit();
	}

	// is help ?
	if (cmdLineOpts.help) {
		printHelp();
		process.exit();
	}
}

function getNexlHomeDir() {

	var nexlHome = cmdLineOpts['nexl-home'];
	if (nexlHome === undefined) {
		nexlHome = path.join(osHomeDir(), DEFAULT_NEXL_HOME_DIR);
	}

	if (!fs.existsSync(nexlHome)) {
		mkdirp.sync(nexlHome);
	}

	return nexlHome;
}

handleArgs();

// --------------------------------------------------------------------------------
module.exports.NEXL_HOME_DIR = getNexlHomeDir();
// --------------------------------------------------------------------------------
