var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
	res.send('nexl expression is evaluated');
});

module.exports = router;
