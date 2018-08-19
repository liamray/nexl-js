const UI_CONSTANTS = {};
UI_CONSTANTS.DIR_ICON = './nexl/site/icons/dir.png';
UI_CONSTANTS.FILE_ICON = './nexl/site/icons/file.png';

UI_CONSTANTS.BAD_USERNAME_MSG = 'Username must contain at least three [A-z0-9] characters and might contain hyphen and underscore characters';
UI_CONSTANTS.BAD_PASSWORD_MSG = 'Password must contain at least one [A-z] character, one number character and must be at least 5 characters';

// --------------------------------------------------------------------------------

// backend module support
if (typeof module !== 'undefined') {
	module.exports = UI_CONSTANTS;
}