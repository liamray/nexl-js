const COMMON_UTILS = {};
COMMON_UTILS.formatDate = formatDate;

// --------------------------------------------------------------------------------

function completeDateTime(x) {
	for (let index = 0; index < x.length; index++) {
		const item = x[index] + '';
		if (item.length < 2) {
			x[index] = `0${item}`;
		}
	}
}

function formatDate() {
	const currentDate = new Date();

	let date = [];
	let time = [];

	date.push(currentDate.getFullYear());
	date.push(currentDate.getMonth() + 1);
	date.push(currentDate.getDate());

	time.push(currentDate.getHours());
	time.push(currentDate.getMinutes());

	completeDateTime(date);
	completeDateTime(time);

	date = date.join('-');
	time = time.join(':');

	return `${date} ${time}`;
}

// --------------------------------------------------------------------------------

// backend module support
if (typeof module !== 'undefined') {
	module.exports = COMMON_UTILS;
}