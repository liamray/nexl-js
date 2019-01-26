const COMMON_UTILS = {};

// todo : use a [https://www.npmjs.com/package/dateformat] instead, import its code to be available for both frontend and backend. pay attention to var|let|const, it can may certain problem when Angular imports external JS file
COMMON_UTILS.formatDate = formatDate;
COMMON_UTILS.validatePasswordStrength = validatePasswordStrength;
COMMON_UTILS.validateUsernameStrength = validateUsernameStrength;

// --------------------------------------------------------------------------------

function completeDateTime(x) {
	for (var index = 0; index < x.length; index++) {
		const item = x[index] + '';
		if (item.length < 2) {
			x[index] = '0' + item;
		}
	}
}

function formatDate() {
	const currentDate = new Date();

	var date = [];
	var time = [];

	date.push(currentDate.getFullYear());
	date.push(currentDate.getMonth() + 1);
	date.push(currentDate.getDate());

	time.push(currentDate.getHours());
	time.push(currentDate.getMinutes());
	time.push(currentDate.getSeconds());

	completeDateTime(date);
	completeDateTime(time);

	date = date.join('-');
	time = time.join(':');

	return date + ' ' + time;
}

function validateUsernameStrength(username) {
	return username.match(/^[a-zA-Z0-9]+([_-]?[a-zA-Z0-9]){2,}$/) !== null;
}

function validatePasswordStrength(passowrd) {
	return passowrd.match(/(?=.*[0-9])(?=.*[A-z]).{5,}/) !== null;
}

// --------------------------------------------------------------------------------

// backend module support
if (typeof module !== 'undefined') {
	module.exports = COMMON_UTILS;
}