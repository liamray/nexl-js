/********************************************************************************************
 * data
 ********************************************************************************************/

// importing from nexl-sources2.js ( for test purposes )
'@ nexl-source2.js';

HOSTS = {};

HOSTS.INTERFACES = {
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

INTERFACES_BY_ENV = "${HOSTS.INTERFACES.${ENV!A}.${INSTANCE!C}:${HOSTS.INTERFACES.${ENV!A}~V}~V}";

PROD_ENVS = ["PROD.${INSTANCE!C}", "DRP-PROD"];

var ALL_PROD_INTERFACES_DEF = {
	"PROD": "${HOSTS.INTERFACES.${PROD_ENVS}~V!C-}"
};

var ALL_PROD_INTERFACES = "${ALL_PROD_INTERFACES_DEF.${ENV!A}:${HOSTS.INTERFACES.${ENV!A}.${INSTANCE!C}~V!C}:${HOSTS.INTERFACES.${ENV!A}~V}~V}";
