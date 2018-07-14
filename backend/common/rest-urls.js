const REST_URLS = {};

REST_URLS.ROOT = 'nexl';

REST_URLS.AUTH = {};

REST_URLS.GENERAL = {};

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

REST_URLS.PERMISSIONS = {};

REST_URLS.SETTINGS = {};

// --------------------------------------------------------------------------------

// backend module support
if (typeof module !== 'undefined') {
	module.exports = REST_URLS;
}