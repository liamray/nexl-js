const REST_URLS = {};

REST_URLS.ROOT = 'nexl';

REST_URLS.AUTH = {
	PREFIX: 'auth',
	URLS: {
		ENABLE_DISABLE_USER: '/enable-disable-user',
		RENAME_USER: '/rename-user',
		REMOVE_USER: '/remove-user',
		LIST_USERS: '/list-users',
		CHANGE_PASSWORD: '/change-password',
		GENERATE_REGISTRATION_TOKEN: '/generate-token',
		RESOLVE_USER_STATUS: '/resolve-status',
		LOGIN: '/login',
		REGISTER: '/register'
	}
};

REST_URLS.GENERAL = {
	PREFIX: 'general',
	URLS: {
		INFO: '/info'
	}
};

REST_URLS.JS_FILES = {
	PREFIX: 'jsfiles',
	URLS: {
		MOVE: '/move',
		RENAME: '/rename',
		DELETE: '/delete',
		MAKE_DIR: '/make-dir',
		TREE_ITEMS: '/get-tree-items-hierarchy',
		LOAD_JS_FILE: '/load-jsfile',
		SAVE_JS_FILE: '/save-jsfile'
	}
};

REST_URLS.PERMISSIONS = {
	PREFIX: 'permissions',
	URLS: {
		LOAD_PERMISSIONS: '/load',
		SAVE_PERMISSIONS: '/save'
	}
};

REST_URLS.SETTINGS = {
	PREFIX: 'settings',
	URLS: {
		SAVE_SETTINGS: '/save',
		LOAD_SETTINGS: '/load'
	}
};

// --------------------------------------------------------------------------------

// backend module support
if (typeof module !== 'undefined') {
	module.exports = REST_URLS;
}