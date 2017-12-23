const settings = require('../backend/nexl/settings.js');
const assert = require('assert');

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
