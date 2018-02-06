const confMgmt = require('./conf-mgmt');

const READ_PERMISSION = 'read';
const WRITE_PERMISSION = 'write';
const EXTERNAL_INCLUDES_PERMISSION = 'externalIncludes';

function isAdmin(user) {
	const admins = confMgmt.load(confMgmt.CONF_FILES.ADMINS);
	return admins.admins && admins.admins.indexOf(user) >= 0;
}

function hasPermission(user, permissionType, resource) {
	if (isAdmin(user)) {
		return true;
	}

	// loading groups
	const groups = confMgmt.load(confMgmt.CONF_FILES.GROUPS);

	// collecting groups which contain our user into the entities array
	var entities = [user];
	for (var group in groups) {
		if (groups[group].indexOf(user) >= 0) {
			entities.push(group);
		}
	}

	// loading permissions matrix
	const permissions = confMgmt.load(confMgmt.CONF_FILES.PERMISSIONS);

	// iterating over permissions and checking
	var result = false;
	for (var entity in permissions) {
		// is user or group present in permission matrix ?
		if (!entities.indexOf(entity)) {
			continue;
		}

		var permission = permissions[entity];
		var permissionValue = permission[permissionType];
		if ( permissionValue !== undefined ) {
			result = result || permissionValue;
		}
	}

	return result;
}

function hasReadPermission(user) {
	return hasPermission(user, READ_PERMISSION);
}

function hasWritePermission(user) {
	return hasPermission(user, WRITE_PERMISSION);
}

// --------------------------------------------------------------------------------
module.exports.isAdmin = isAdmin;
module.exports.hasReadPermission = hasReadPermission;
// --------------------------------------------------------------------------------
