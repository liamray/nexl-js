/********************************************************************************************
 * data
 ********************************************************************************************/

// importing from nexl-sources2.js ( for test purposes )
'@ nexl-source2.js';

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


INTERFACES_BY_ENV = "${HOSTS.APP_SERVER_INTERFACES.${ENV!A}.${INSTANCE!C}:${HOSTS.APP_SERVER_INTERFACES.${ENV!A}~V}~V}";

PROD_ENVS = ["PROD.${INSTANCE!C}", "DRP-PROD"];

var ALL_PROD_INTERFACES_DEF = {
	"PROD": "${HOSTS.APP_SERVER_INTERFACES.${PROD_ENVS}~V!C-}"
};

var ALL_APP_SERVER_INTERFACES = "${ALL_PROD_INTERFACES_DEF.${ENV!A}:${HOSTS.APP_SERVER_INTERFACES.${ENV!A}.${INSTANCE!C}~V!C}:${HOSTS.APP_SERVER_INTERFACES.${ENV!A}~V}~V-}";

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

ENV = '${HOSTS.APP_SERVER_INTERFACES<${IFC}:${HOSTS.INTERNET_INTERFACES<${IFC}}!C}';

HOST_TYPE = "${HOSTS<${IFC}}";

INTERNET_SERVERS = {
	"iDB": ["INTERNET_INTERFACES", "INTERNET_BACKOFFICE_INTERFACES"]
};

var DB_DEF = {
	"PROD": "${INTERNET_SERVERS<${HOST_TYPE}:PROD}",
	"TRAIN": "TRAINING"
};

var DB_NAME = "${DB_DEF.${ENV}:${ENV}}";
var DATABASE_DEF = "-DDB_NAME=${DB_NAME}";

////////////////////////////////////////////////////////////////////////////////////////////////
var WS = {};

WS.PORT = "8080";

WS.PORTS_DEF = {
	LOCAL: [9595, 9696]
};

WS.PORTS = "${WS.PORTS_DEF.${ENV!A}:${WS.PORT}}";

WS.ALL_PORTS = ['${WS.PORTS_DEF~V}', '${WS.PORT}'];

WS.URL1 = 'http://test-url:${WS.PORTS}/${ENV!A}';

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
		var hosts = evalNexlExpression('http://${HOSTS.APP_SERVER_INTERFACES.' + escapeDrpProd(key) + '~V}');
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