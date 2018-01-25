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
        req.session.credentials = undefined;
        res.status(500).send('Bad credentials');
        return;
    }

    // authenticated. generate a token
    const credentials = {
        username: username,
        token: utils.generateRandomBytes(16)
    };

    // store credentials in the session
    req.session.credentials = credentials;

    // send it back to the client
    res.send(credentials);

    res.end();
});

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
