const logger = require('../backend/api/logger');
const utils = require('../backend/api/utils');
const fsx = require('../backend/api/fsx');
const fs = require('fs');

/*
fsx.exists('c:\\sfsdfasdf').then(
	() => console.log(':)')
).catch(
	() => console.log(':(')
);*/


fsx.stat('c:\\asdasd').then().catch(
	(err) => console.log(err)
);