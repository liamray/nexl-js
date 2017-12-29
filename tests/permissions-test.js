require('./tests-main');
const permissions = require('../backend/api/permissions');
const assert = require('assert');



function test() {
	permissions.addUserToGroup('qa', 'john');
	permissions.addUserToGroup('qa', 'milena');
	permissions.addUserToGroup('qa', 'a');
	permissions.addUserToGroup('programmers', 'liamr');
	permissions.removeUserFromGroup('qa', 'john');
	const groupUsers = permissions.getUsersInGroup('qa');
	console.log(groupUsers);
}

test();

console.log('Permissions tests are passed OK');