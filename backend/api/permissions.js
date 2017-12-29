const settings = require('./settings');

// example :
// { liamr: { admin: true }, ... }
const PERMISSIONS_FILE = 'permissions.js';

// example :
// { beastsGroup: ['user1', 'star', ...], ... }
const GROUPS_FILE = 'groups.js';

const TYPES = {
	CHECKBOX: 'checkbox',
	TEXT: 'text'
};

const PERMISSIONS = {
	ADMIN: {
		ID: 'admin',
		TYPE: TYPES.CHECKBOX
	},

	READ_NEXL_SOURCES: {
		ID: 'read-nexl-sources',
		TYPE: TYPES.TEXT
	},

	WRITE_NEXL_SOURCES: {
		ID: 'write-nexl-sources',
		TYPE: TYPES.TEXT
	},

	INCLUDE_FOREIGN_NEXL_SOURCES: {
		ID: 'include-foreign-nexl-sources',
		TYPE: TYPES.CHECKBOX
	}
};


function getPermission(permissionId, target) {
	var permissions = settings.load(PERMISSIONS_FILE)[target];
	return permissions === undefined ? undefined : permissions[permissionId];
}

function setPermission(permissionId, value, target) {
	var permission = {};
	permission[target] = {};
	permission[target][permissionId] = value;
	settings.save(permission, PERMISSIONS_FILE);
}

function getUsersInGroup(groupName) {
	return settings.load(GROUPS_FILE, GROUPS_FILE)[groupName];
}

function deleteGroup(groupName) {
	if (!settings.load(GROUPS_FILE)[groupName]) {
		return;
	}

	var groupItem = {};
	groupItem[groupName] = undefined;
	settings.save(groupItem, GROUPS_FILE);
}

function addUserToGroup(group, user) {
	// loading group item
	var groupItem = settings.load(GROUPS_FILE)[group];
	if (!groupItem) {
		groupItem = [];
	}

	// if user already exists don't add a new one
	if (groupItem.indexOf(user) >= 0) {
		return;
	}

	// saving
	var record = {};
	record[group] = [user];
	settings.save(record, GROUPS_FILE);
}

function removeUserFromGroup(group, user) {
	// loading group item
	var groupItem = settings.load(GROUPS_FILE)[group];

	// doesn't group exist ?
	if (!groupItem) {
		return;
	}

	// doesn't user exist in group ?
	var index = groupItem.indexOf(user);
	if (index < 0) {
		return;
	}

	// removing user from group
	groupItem.splice(index, 1);

	var record = {};
	// cleaning the whole group ( otherwise it will merge arrays )
	record[group] = undefined;
	settings.save(record, GROUPS_FILE);

	// storing group item
	record[group] = groupItem;
	settings.save(record, GROUPS_FILE);
}

// --------------------------------------------------------------------------------
module.exports.PERMISSIONS = PERMISSIONS;
module.exports.TYPES = TYPES;

module.exports.getPermission = getPermission;
module.exports.setPermission = setPermission;
module.exports.addUserToGroup = addUserToGroup;
module.exports.deleteGroup = deleteGroup;
module.exports.getUsersInGroup = getUsersInGroup;
module.exports.removeUserFromGroup = removeUserFromGroup;
// --------------------------------------------------------------------------------
