const express = require('express');
const restFuncs = require('../api/rest-funcs');

const router = express.Router();


router.get('/get-nexl-sources', function (req, res, next) {
	restFuncs.getNexlSources().then(
		function (data) {
			res.send(data);
		}).catch(
		function (err) {
			res.status(500).send(err);
		});
});

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


// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------