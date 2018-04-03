const path = require('path');
const tmpDir = require('os').tmpdir();
const nexlHome = path.join(tmpDir, '.nexl');

process.argv.push('--nexl-home=' + nexlHome);
