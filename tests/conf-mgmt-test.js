require('./tests-main');

const confMgmt = require('../backend/api/conf-mgmt');
const cmdLineArgs = require('../backend/nexl/cmd-line-args');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const TEST_FILE = 'test.js';

// clear all data
confMgmt.save({}, TEST_FILE);

// add records
confMgmt.save({cars: {BMW: 1}}, TEST_FILE);
confMgmt.save({cars: {Mercedes: 2}}, TEST_FILE);
confMgmt.save({cars: {X: 3}}, TEST_FILE);

// delete record
confMgmt.save({cars: {X: undefined}}, TEST_FILE);

// load and verify
assert(confMgmt.load(TEST_FILE)['BMW'] === undefined);
assert(confMgmt.load(TEST_FILE)['cars']['BMW'] === 1);
assert(confMgmt.load(TEST_FILE)['cars']['X'] === undefined);

confMgmt.deleteConfFile(TEST_FILE);

assert(!fs.existsSync(path.join(cmdLineArgs.NEXL_HOME_DIR, TEST_FILE)));

console.log('Configuration management tests are passed OK');