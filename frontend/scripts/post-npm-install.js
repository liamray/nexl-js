///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// importing winston's log levels and storing in file in frontend ( unfortunately it's impossible to import that directly )
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const WINSTON_LOG_LEVELS = './src/app/main/common/winston-log-levels.json';

console.log('-----------------------------------------------------------------------------------------------------------------');
console.log(`Generating a [${WINSTON_LOG_LEVELS}] file. You must run an [npm i] command on backend before you run this script !`);
console.log('-----------------------------------------------------------------------------------------------------------------');

const winston = require('winston');
const fs = require('fs');

fs.writeFileSync(WINSTON_LOG_LEVELS, JSON.stringify(winston.levels, null, 2));

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// copying a licensed version of jqxWidgets to node_modules
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
