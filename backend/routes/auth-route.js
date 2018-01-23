const express = require('express');
const auth = require('../api/authentication');
const utils = require('../api/utils');

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

    // if not authenticated, clear token and send error
    if (!auth.isPasswordValid(username, req.body.password)) {
        req.session.token = undefined;
        res.status(500).send('Bad credentials');
        return;
    }

    // authenticated. store token in the session, send token back
    const token = utils.generateRandomBytes(16);
    req.session.token = token;

    res.send({
        username: username,
        token: token
    });
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
