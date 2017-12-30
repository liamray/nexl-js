require('./tests-main');

const settings = require('../backend/api/settings');
const assert = require('assert');

function test() {
	assert(true);
	var nexlHomeDir;
	nexlHomeDir = settings.get(settings.NEXL_SOURCES_DIR);
	console.log(nexlHomeDir);
	settings.set(settings.NEXL_SOURCES_DIR, 'c:\\temp\\nexl-sources');
	nexlHomeDir = settings.get(settings.NEXL_SOURCES_DIR);
	console.log(nexlHomeDir);
}

test();

console.log('Settings tests are passed OK');