const commandLineArgs = require('command-line-args');
const util = require('util');
const version = require('./../../package.json').version;

const NEXL_HOME_DEF = 'nexl-home';

const CMD_LINE_OPTS_DEF = [
	{
		name: NEXL_HOME_DEF,
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
	for (let index in CMD_LINE_OPTS_DEF) {
		// length
		const item = CMD_LINE_OPTS_DEF[index];
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
	let cmdLineOpts;

	try {
		cmdLineOpts = commandLineArgs(CMD_LINE_OPTS_DEF);
	} catch (e) {
		console.log('Bad command line opt(s)');
		console.log(e.message);
		printHelp();
		process.exit(1);
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

	return cmdLineOpts;
}

// --------------------------------------------------------------------------------
module.exports.init = handleArgs;
module.exports.NEXL_HOME_DEF = NEXL_HOME_DEF;
// --------------------------------------------------------------------------------
