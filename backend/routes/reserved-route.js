const express = require('express');
const router = express.Router();

router.get('/', function (req, res, next) {
	res.status(500).send("[/nexl] path is reserved for internal purposes");
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
