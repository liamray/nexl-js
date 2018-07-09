const GUEST_USER = 'guest';
const AUTHENTICATED = 'authenticated';
const ADMIN_USER = 'admin';

// --------------------------------------------------------------------------------
const SECURITY_CONSTANTS = {};
SECURITY_CONSTANTS.GUEST_USER = GUEST_USER;
SECURITY_CONSTANTS.AUTHENTICATED = AUTHENTICATED;
SECURITY_CONSTANTS.ADMIN_USER = ADMIN_USER;

// --------------------------------------------------------------------------------

// backend module support
if (typeof module !== 'undefined') {
	module.exports = SECURITY_CONSTANTS;
}