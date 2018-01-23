const express = require('express');
const auth = require('../api/authentication');

const router = express.Router();

/*
/logout
/generate-token
/set-password
/change-password
/is-password-valid
/get-users-list
*/

router.post('/login', function (req, res) {
    const username = req.body.username;
    if (auth.isPasswordValid(username, req.body.password)) {
        res.send({
            username: username,
            token: Math.random()
        });
    } else {
        res.status(500).send('Bad credentials');
    }
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
