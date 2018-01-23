require('./tests-main');
const auth = require('../backend/api/authentication');
const assert = require('assert');


const username = 'liamr';
const password = '123456';


function test() {
	auth.deleteUser(username);

	assert(!auth.isPasswordValid(username, password));

	var token = '654321';
	new Promise(function (resolve, reject) {
		try {
			auth.setPassword(username, password, token);
		} catch (e) {
			reject();
		}
		resolve();
	}).then(function () {
		assert(false)
	}).catch(function () {
		assert(true)
	});

	token = auth.generateToken(username);
	new Promise(function (resolve, reject) {
		try {
			auth.setPassword(username, password, token);
		} catch (e) {
			reject();
		}
		resolve();
	}).then(function () {
		assert(true)
	}).catch(function () {
		assert(false)
	});

	assert(auth.isPasswordValid(username, password));
	auth.deleteUser(username);
	assert(!auth.isPasswordValid(username, password));
}

test();

console.log('Authentication tests are passed OK');