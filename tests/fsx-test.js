const testBase = require('./tests-base');
const fsx = require('../backend/api/fsx');
const fs = require('fs');
const path = require('path');
const confMgmt = require('../backend/api/conf-mgmt');

// testing move item
fs.mkdirSync(path.join(testBase.NEXL_SOURCES_DIR, 'dir1'));