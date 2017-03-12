var ne = require('./../nexl-engine/nexl-engine');
var j79 = require('j79-utils');

var nexlSource;
nexlSource = {asFile: {fileName: 'tests/nexl-sources/nexl-source1.js'}};

var externalArgs = {
	obj7: {
		home: 'c:\\temp'
	}
};

var result;
result = ne.nexlize(nexlSource, '${obj7+${obj8}}', externalArgs);

console.log(result);
console.log('\ntype = ' + j79.getType(result));