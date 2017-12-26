var express = require('express');
var router = express.Router();
/*
/get-nexl-sources
/generate-token
/set-password
/change-password
/is-password-valid
/get-users-list
/delete-user

/is-admin
/get-all-permissions
/set-all-permissions

/add-user-to-group
/remove-user-from-group
/delete-group
 */

router.post('/get-nexl-sources', function (req, res, next) {
	res.send('nexl rest is working');
});

module.exports = router;
