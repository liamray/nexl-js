// --------------------------------------------------------------------------------
// frontend module export support
if (typeof module === 'undefined') {
	module = {};
	module.exports = {};
}
// --------------------------------------------------------------------------------

const CONF_FILES = {
	SETTINGS: 'settings.js', // general settings
	USERS: 'users.js', // users, passwords ( encrypted ), tokens etc...
	ADMINS: 'admins.js', // administrators list
	PERMISSIONS: 'permissions.js' // permissions matrix
};

// --------------------------------------------------------------------------------
// available options for SETTINGS
const SETTINGS = {
	JS_FILES_ROOT_DIR: 'js-files-root-dir',
	JS_FILES_ENCODING: 'js-files-encoding',
	HTTP_TIMEOUT: 'http-timeout-sec',
	LDAP_URL: 'ldap-url',
	LDAP_BASE_DN: 'ldap-base-dn',
	LDAP_BIND_DN: 'ldap-bind-dn',
	LDAP_BIND_PASSWORD: 'ldap-bind-password',
	LDAP_FIND_BY: 'ldap-find-by',

	HTTP_BINDING: 'http-binding',
	HTTP_PORT: 'http-port',
	HTTPS_BINDING: 'https-binding',
	HTTPS_PORT: 'https-port',
	SSL_CERT_LOCATION: 'ssl-cert-location',
	SSL_KEY_LOCATION: 'ssl-key-location',

	LOG_FILE_LOCATION: 'log-file-location',
	LOG_LEVEL: 'log-level',
	LOG_ROTATE_FILE_SIZE: 'log-rotate-file-size-kb',
	LOG_ROTATE_FILES_COUNT: 'log-rotate-files-count'
};

// --------------------------------------------------------------------------------

const NEXL_HOME_DEF = 'nexl-home';

// --------------------------------------------------------------------------------
module.exports.CONF_FILES = CONF_FILES;
module.exports.SETTINGS = SETTINGS;
module.exports.NEXL_HOME_DEF = NEXL_HOME_DEF;
CONF_CONSTANTS = module.exports;
// --------------------------------------------------------------------------------
