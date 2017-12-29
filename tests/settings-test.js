require('./tests-main');

const settings = require('../backend/api/settings');
const cmdLineArgs = require('../backend/nexl/cmd-line-args');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const TEST_FILE = 'test.js';

// clear all data
settings.save({}, TEST_FILE);

// add records
settings.save({cars: {BMW: 1}}, TEST_FILE);
settings.save({cars: {Mercedes: 2}}, TEST_FILE);
settings.save({cars: {X: 3}}, TEST_FILE);

// delete record
settings.save({cars: {X: undefined}}, TEST_FILE);

// load and verify
assert(settings.load(TEST_FILE)['BMW'] === undefined);
assert(settings.load(TEST_FILE)['cars']['BMW'] === 1);
assert(settings.load(TEST_FILE)['cars']['X'] === undefined);

settings.deleteSettingsFile(TEST_FILE);

assert(!fs.existsSync(path.join(cmdLineArgs.NEXL_HOME_DIR, TEST_FILE)));

console.log('Settings tests are passed OK');