/********************************************************************************************
 * data
 ********************************************************************************************/

// importing from file2.js ( for test purposes )
'@ file2.js';

cars = [
	{name: 'Bugatti Veyron', speed: 268},
	{name: 'McLaren F1', speed: 231},
	{name: 'Ferrari LaFerrari', speed: 217}
];


largestCountries = [
	{
		name: 'Russia',
		capital: 'Moscow',
		population: 144498215
	},
	{
		name: 'Canada',
		capital: 'Ottawa',
		population: 35151728
	},
	{
		name: 'USA',
		capital: 'Washington, D.C.',
		population: 324987000
	},
	{
		name: 'China',
		capital: 'Beijing',
		population: 1373541278
	}
];

HOSTS = {};

////////////////////////////////////////////////////////////////////////////////////////////////

HOSTS.APP_SERVER_INTERFACES = {
	"PROD": {
		"FIRST": ["hothead1", "awakening1", "dynamite1", "military1"],
		"SECOND": ["cuddly2", "grease2", "fate2", "atmosphere2"]
	},

	"DEV": ['zombie', 'arrows', 'zebra'],

	"QA": {
		"FIRST": ["autonomous1", "criminal1"],
		"SECOND": ["adrenaline2", "prophetic2"]
	},

	"DRP-PROD": "drp-prod",
	"YEST": "yest",
	"STAGING": "jstaging"
};

var ALL_PROD_INTERFACES_DEF = {
	"PROD": ['${HOSTS.APP_SERVER_INTERFACES.${ENV}.${INSTANCE}@${HOSTS.APP_SERVER_INTERFACES.${ENV}}~V}', '${HOSTS.APP_SERVER_INTERFACES.DRP\\-PROD}']
};

var ALL_APP_SERVER_INTERFACES = "${ALL_PROD_INTERFACES_DEF.${ENV}@${HOSTS.APP_SERVER_INTERFACES.${ENV}.${INSTANCE}~V}@${HOSTS.APP_SERVER_INTERFACES.${ENV}~V}~V}";

////////////////////////////////////////////////////////////////////////////////////////////////

HOSTS.INTERNET_INTERFACES = {
	"PROD": ["iMaximum", "iPromised", "iPilot"],

	"DEV": 'iHomeland',

	"QA": ["iTruth", "iSilver"],

	"YEST": "iYest",
	"STAGING": "iStaging",
	"SPECIAL": "iDeer"
};

////////////////////////////////////////////////////////////////////////////////////////////////

ENV = '${HOSTS.APP_SERVER_INTERFACES<${IFC}[0]@${HOSTS.INTERNET_INTERFACES<${IFC}[0]}}';

HOST_TYPE = "${HOSTS<${IFC}[0]}";

INTERNET_SERVERS = {
	"iDB": ["INTERNET_INTERFACES", "INTERNET_BACKOFFICE_INTERFACES"]
};

var DB_DEF = {
	"PROD": "${INTERNET_SERVERS<${HOST_TYPE}[0]@PROD}",
	"TRAIN": "TRAINING"
};

var DB_NAME = "${DB_DEF.${ENV}@${ENV}}";
var DATABASE_DEF = "-DDB_NAME=${DB_NAME}";

DEBUG_OPTS_DEF = {
	'-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=8790': ['on', 'true']
};

DEBUG_OPTS = '${DEBUG_OPTS_DEF<${IS_DEBUG_ON}}';

////////////////////////////////////////////////////////////////////////////////////////////////
var WS = {};

WS.PORT = "8080";

WS.PORTS_DEF = {
	LOCAL: [9595, 9696]
};

WS.PORTS = "${WS.PORTS_DEF.${ENV}@${WS.PORT}}";

WS.ALL_PORTS = ['${WS.PORTS_DEF~V}', '${WS.PORT}'];

WS.URL1 = 'http://test-url:${WS.PORTS}/${ENV}';

ALL_HOSTS_AND_PORTS1 = '${HOSTS.APP_SERVER_INTERFACES~V}[${WS.ALL_PORTS}]';
ALL_HOSTS_AND_PORTS2 = '${ALL_APP_SERVER_INTERFACES}[${WS.PORTS}]';


////////////////////////////////////////////////////////////////////////////////////////////////
function escapeDrpProd(str) {
	if (str === 'DRP-PROD') {
		return 'DRP\\-PROD';
	}

	return str;
}

function makeUrls() {
	var result = {};

	for (var key in HOSTS.APP_SERVER_INTERFACES) {
		var value = HOSTS.APP_SERVER_INTERFACES[key];
		var hosts = nexl.nexlize('http://${HOSTS.APP_SERVER_INTERFACES.' + escapeDrpProd(key) + '~V}');
		result[key] = hosts;
	}

	return result;
}

function discoverInstance(ifc) {
	if (ifc.charAt(ifc.length - 1) == "1") {
		return "FIRST";
	}
	if (ifc.charAt(ifc.length - 1) == "2") {
		return "SECOND";
	}

	return null;
}

iterationBody1 = '${_item_^U}';
iterationBody2 = '${_key_^U}';
iterationBody3 = '${_value_^U}';

nexl.init = function () {
	nexl.set('test', 'omglol');
};

nexl.addInitFunc(function () {
	nexl.nexlize('${@blabla=OMG}', {OMG: 1});
});

nexl.addInitFunc(function () {
	nexl.nexlize('${@OMG=blabla}', {});
});

nexl.nexlize('${@79=LR}');
