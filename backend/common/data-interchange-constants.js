const DI_CONSTANTS = {};
DI_CONSTANTS.FILE_LOAD_TIME = 'file-load-time';
DI_CONSTANTS.FILE_BODY = 'file-body';
DI_CONSTANTS.RELATIVE_PATH = 'relative-path';
DI_CONSTANTS.TEXT = 'text';
DI_CONSTANTS.MATCH_CASE = 'match-case';
DI_CONSTANTS.IS_REGEX = 'is-regex';

// --------------------------------------------------------------------------------

// backend module support
if (typeof module !== 'undefined') {
	module.exports = DI_CONSTANTS;
}