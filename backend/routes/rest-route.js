const express = require('express');
const restFuncs = require('../api/rest-funcs');
const path = require('path');

const router = express.Router();

router.post('/get-nexl-sources', function (req, res, next) {
	var relativePath = req.body['relativePath'] || path.sep;

	restFuncs.getNexlSources(relativePath).then(
		function (data) {
			res.send(data);
		}).catch(
		function (err) {
			res.status(500).send(err);
		});
});

/*
 /get-nexl-sources
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
