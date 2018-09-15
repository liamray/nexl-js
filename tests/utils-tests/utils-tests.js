const utils = require('../../backend/api/utils');
const assert = require('assert');

// empty file name is not allowed
assert(!utils.isFilePathValid(''));
// empty dir is allowed when path is relative
assert(utils.isDirPathValid(''));

assert(!utils.isFilePathValid('../source.js'));
assert(!utils.isDirPathValid('../source.js'));

assert(!utils.isFilePathValid('..\\source.js'));
assert(!utils.isDirPathValid('..\\source.js'));

assert(utils.isFilePathValid('./source.js'));
assert(utils.isDirPathValid('./source.js'));

assert(utils.isFilePathValid('.\\source.js'));
assert(utils.isDirPathValid('.\\source.js'));

assert(!utils.isFilePathValid('./../source.js'));
assert(!utils.isDirPathValid('./../source.js'));

assert(!utils.isFilePathValid('.\\..\\source.js'));
assert(!utils.isDirPathValid('.\\..\\source.js'));

assert(!utils.isFilePathValid('.//source.js'));
assert(!utils.isDirPathValid('.//source.js'));

assert(!utils.isFilePathValid('.\\\\source.js'));
assert(!utils.isDirPathValid('.\\\\source.js'));

assert(!utils.isFilePathValid('././source.js'));
assert(!utils.isDirPathValid('././source.js'));

assert(!utils.isFilePathValid('.\\.\\source.js'));
assert(!utils.isDirPathValid('.\\.\\source.js'));

assert(!utils.isFilePathValid('.'));
assert(!utils.isDirPathValid('.'));

assert(!utils.isFilePathValid('/'));
assert(utils.isDirPathValid('/'));

assert(!utils.isFilePathValid('\\'));
assert(utils.isDirPathValid('\\'));

assert(!utils.isFilePathValid('//'));
assert(!utils.isDirPathValid('//'));

assert(!utils.isFilePathValid('\\\\'));
assert(!utils.isDirPathValid('\\\\'));

assert(!utils.isFilePathValid('//a'));
assert(!utils.isDirPathValid('//a'));

assert(!utils.isFilePathValid('\\\\a'));
assert(!utils.isDirPathValid('\\\\a'));

assert(!utils.isFilePathValid('a//b'));
assert(!utils.isDirPathValid('a//b'));

assert(!utils.isFilePathValid('a\\\\b'));
assert(!utils.isDirPathValid('a\\\\b'));

assert(utils.isFilePathValid('a/c/b'));
assert(utils.isDirPathValid('a/c/b'));

assert(utils.isFilePathValid('a\\c\\b'));
assert(utils.isDirPathValid('a\\c\\b'));

assert(utils.isFilePathValid('/c:\\storage-file1.js'));
