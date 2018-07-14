///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// this script import winston's log levels and storing in file in frontend ( unfortunately it's impossible to import that directly )
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const WINSTON_LOG_LEVELS = './src/app/main/common/winston-log-levels.json';

console.log('-----------------------------------------------------------------------------------------------------------------');
console.log(`Generating a [${WINSTON_LOG_LEVELS}] file. You must run an [npm i] command on backend before you run this script !`);
console.log('-----------------------------------------------------------------------------------------------------------------');

const winston = require('winston');
const fs = require('fs');

fs.writeFileSync(WINSTON_LOG_LEVELS, JSON.stringify(winston.levels, null, 2));