// todo : make tests for conf-mgmt.js, security.js
// todo : REST API

const testBase = require('./tests-base');
const fsx = require('../backend/api/fsx');
const fs = require('fs');
const fsextra = require('fs-extra');
const path = require('path');

let DIRS;

function init(dirs) {
	DIRS = dirs;
	return Promise.resolve();
}

// running promises sequentially
const finalPromise = [init].reduce(
	(promise, item) => {
		return promise.then(item);
	}, testBase.then(dirs => DIRS = dirs));

finalPromise.then(
	() => {
		console.log('Success !!!');
	}).catch(
	err => {
		console.log('TEST FAILED !!! Reason :');
		console.log(err);
	});
