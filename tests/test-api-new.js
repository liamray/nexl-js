#!/usr/bin/env node

const nexlApp = require('../backend/nexl-app/nexl-app');
const confConsts = require('../backend/common/conf-constants');
const confMgmt = require('../backend/api/conf-mgmt');

process.argv.push(`--${confConsts.NEXL_HOME_DEF}=c:\\temp\\.nexl`);

nexlApp.create()
	.then(nexlApp.init)
	.then(_ => {
		const settings = confMgmt.getNexlSettingsCached();
		settings[confConsts.SETTINGS.HTTP_PORT] = 9191;
	})
	.then(nexlApp.start)
	.then(nexlApp.stop);