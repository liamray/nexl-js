var ne = require('./../nexl-engine/nexl-engine');
var j79 = require('j79-utils');

var nexlSource;
nexlSource = {asFile: {fileName: 'tests/nexl-sources/nexl-source1.js'}};

var externalArgs = {_INSTANCE: 'FIRST', _ENV: 'QA', _IFC: 'hothead1'};

result = ne.nexlize(nexlSource, '${arr1+\\\\\\${}', externalArgs);

console.log(result);
console.log('\ntype = ' + j79.getType(result));