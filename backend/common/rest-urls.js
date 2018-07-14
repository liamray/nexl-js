const REST_URLS = {};

REST_URLS.root = 'nexl';

REST_URLS.AUTH = {};

REST_URLS.GENERAL = {};

REST_URLS.JS_FILES = {
	MOVE: '/move',
	RENAME: '/rename',
	DELETE: '/delete',
	MKDIR: '/make-dir',
	TREE_ITEMS: '/get-tree-items-hierarchy',
	LOAD_JS_FILE: '/load-jsfile',
	SAVE_JS_FILE: '/save-jsfile'
};

REST_URLS.PERMISSIONS = {};

REST_URLS.SETTINGS = {};

// --------------------------------------------------------------------------------

// backend module support
if (typeof module !== 'undefined') {
	module.exports = REST_URLS;
}