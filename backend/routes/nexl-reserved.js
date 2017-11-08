var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
	res.status(500).send("[/nexl] path is reserved for internal purposes");
});

module.exports = router;
