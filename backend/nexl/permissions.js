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
	settings.save(permission);
}

function getGroupUsers(group) {
	return settings.load(GROUPS_FILE)[group];
}

function addUserToGroup(group, user) {
	// loading group item
	var groupItem = settings.load(GROUPS_FILE)[group];
	if (!groupItem) {
		groupItem = [];
	}

	// creating group item if doesn't exist
	if (groupItem.indexOf(user) < 0) {
		groupItem.push(user);
	}

	// saving
	var record = {};
	record[group] = groupItem;
	settings.save(record);
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
	settings.save(record);

	// storing group item
	record[group] = groupItem;
	settings.save(record);
}

// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
