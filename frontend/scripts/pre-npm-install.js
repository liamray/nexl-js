///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// this script copies a licensed version of jqxWidgets to node_modules
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const fse = require('fs-extra');

const srcDir = './jqwidgets';
const destDir = './node_modules/jqwidgets-scripts';

console.log('-----------------------------------------------------------------------------------------------------------------');
console.log(`Copying a [${srcDir}] licensed version to [${destDir}] directory`);
console.log('-----------------------------------------------------------------------------------------------------------------');

fse.remove(destDir)
  .then(_ => fse.ensureDir(destDir))
  .then(_ => fse.copy(srcDir, destDir));
