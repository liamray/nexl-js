const testBase = require('./tests-base');
const fsx = require('../backend/api/fsx');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

let DIRS;

function renameTest1() {
	return fsx.rename(path.join(DIRS.NEXL_SOURCES_DIR, 'ALMOND2'), path.join(DIRS.NEXL_SOURCES_DIR, 'CASHEW1')).then(
		() => {
			return Promose.reject('Wrong item rename operation');
		}
	).catch(
		(err) => {
			return Promise.resolve();
		}
	);
}

function renameTest2() {
	return fsx.rename(path.join(DIRS.NEXL_SOURCES_DIR, 'ALMOND1'), path.join(DIRS.NEXL_SOURCES_DIR, 'CASHEW1'));
}

function renameTest() {
	return Promise.resolve().then(() => {
		fs.mkdirSync(path.join(DIRS.NEXL_SOURCES_DIR, 'ALMOND1'));
		fs.mkdirSync(path.join(DIRS.NEXL_SOURCES_DIR, 'ALMOND1', 'ALMOND2'));
		fs.mkdirSync(path.join(DIRS.NEXL_SOURCES_DIR, 'ALMOND1', 'ALMOND2', 'ALMOND3'));

		return renameTest1().then(renameTest2);
	});
}

function init(dirs) {
	DIRS = dirs;
}

testBase.then(init).then(renameTest).then(
	() => {
		console.log('Success !!!');
	}).catch(
	err => {
		throw err;
	});