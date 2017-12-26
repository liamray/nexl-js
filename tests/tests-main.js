const path = require('path');
var tmpDir = require('os').tmpdir();
var nexlHome = path.join(tmpDir, 'nexl-tests');

process.argv.push('--nexl-home=' + nexlHome);
