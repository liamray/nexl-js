var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
	res.redirect('/nexl/site');
});

module.exports = router;
