const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const router = express.Router();

/*
/logout
/generate-token
/set-password
/change-password
/is-password-valid
/get-users-list
*/

passport.use(new LocalStrategy(function (userName, password, done) {
    // authentication goes here ( check the userName and password here )
    done(null, userName); // authenticated
    return;

    done(null, false); // not authenticated
    done('error message', false); // error occurred
}));

passport.serializeUser(function (user, done) {
    // the second parameter is what actually will be saved in the cookies
    // you can save a user name, but also you can replace it with user id
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

router.post('/login', passport.authenticate('local'), function login(req, res, next) {
        res.send(req.user);
    }
);

// --------------------------------------------------------------------------------
module.exports = router;
// --------------------------------------------------------------------------------
