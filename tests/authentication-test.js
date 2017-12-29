require('./tests-main');
const auth = require('../backend/api/authentication');
const assert = require('assert');


const userName = 'liamr';
const password = '123456';


function test() {
	auth.deleteUser(userName);

	assert(!auth.isPasswordValid(userName, password));

	var token = '654321';
	new Promise(function (resolve, reject) {
		try {
			auth.setPassword(userName, password, token);
		} catch (e) {
			reject();
		}
		resolve();
	}).then(function () {
		assert(false)
	}).catch(function () {
		assert(true)
	});

	token = auth.generateToken(userName);
	new Promise(function (resolve, reject) {
		try {
			auth.setPassword(userName, password, token);
		} catch (e) {
			reject();
		}
		resolve();
	}).then(function () {
		assert(true)
	}).catch(function () {
		assert(false)
	});

	assert(auth.isPasswordValid(userName, password));
	auth.deleteUser(userName);
	assert(!auth.isPasswordValid(userName, password));
}

test();

console.log('Authentication tests are passed OK');