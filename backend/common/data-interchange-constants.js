const DI_CONSTANTS = {};
DI_CONSTANTS.FILE_LOAD_TIME = 'file-load-time';
DI_CONSTANTS.FILE_BODY = 'file-body';

// --------------------------------------------------------------------------------

// backend module support
if (typeof module !== 'undefined') {
	module.exports = DI_CONSTANTS;
}