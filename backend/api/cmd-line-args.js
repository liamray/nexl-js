const commandLineArgs = require('command-line-args');
const util = require('util');
const version = require('./../../package.json').version;

let cmdLineOpts;

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

	let maxLen = 0;
	// discovering length of longest option
	for (let item in CMD_LINE_OPTS_DEF) {
		// length
		const item = CMD_LINE_OPTS_DEF[item];
		maxLen = Math.max(maxLen, item.name.length);
	}

	for (let index in CMD_LINE_OPTS_DEF) {
		const item = CMD_LINE_OPTS_DEF[index];
		let spaces = maxLen - item.name.length + 1;
		spaces = new Array(spaces).join(' ');
		let text;
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

handleArgs();

// --------------------------------------------------------------------------------
module.exports.NEXL_HOME_DIR = cmdLineOpts['nexl-home'];
// --------------------------------------------------------------------------------
