// --------------------------------------------------------------------------------
// frontend module export support
if (typeof module === 'undefined') {
	module = {};
	module.exports = {};
}
// --------------------------------------------------------------------------------

const GUEST_USER = 'guest';
const AUTHENTICATED = 'authenticated';
const ADMIN_USER = 'admin';

// --------------------------------------------------------------------------------
module.exports.GUEST_USER = GUEST_USER;
module.exports.AUTHENTICATED = AUTHENTICATED;
module.exports.ADMIN_USER = ADMIN_USER;

SECURITY_CONSTANTS = module.exports;
// --------------------------------------------------------------------------------
