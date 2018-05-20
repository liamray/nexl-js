require('./tests-main');

const confMgmt = require('../../backend/api/conf-mgmt');
const assert = require('assert');
const path = require('path');

confMgmt.save({asd: true}, confMgmt.CONF_FILES.TOKENS).then(
	() => {
		console.log('OK');
	}
).catch(
	(err) => {
		console.log(err);
	}
);

confMgmt.save({asd: 'dfg3;tiosdf;ktgu;45'}, confMgmt.CONF_FILES.TOKENS).then(
	() => {
		console.log('OK');
	}
).catch(
	(err) => {
		console.log(err);
	}
);


confMgmt.load(confMgmt.CONF_FILES.SETTINGS).then(
	(data) => {
		console.log(data);
	}
).catch(
	(err) => {
		console.log(err);
	}
);