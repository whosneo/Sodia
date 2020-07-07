const passport = require('passport');
require('../middlewares/passport')(passport);

/**
 * Logout user.
 */
exports.logout = async (req, res) => {
    req.logout();
    res.redirect('/');
};

/**
 * Register process.
 */
exports.postRegister = async (req, res, next) => {
    passport.authenticate('local-reg', (err, user, info) => {
        if (err)
            return next(err);
        if (!user) {
            return res.json({status: -1, message: info.message});
        }
        req.logIn(user, err => {
            if (err)
                return next(err);
            let returnTo = req.session.returnTo || '/';
            delete req.session.returnTo;
            res.json({status: 0, redirect: returnTo});
        });
    }, next)(req, res, next);
};

/**
 * Login process.
 */
exports.postLogin = async (req, res, next) => {
    passport.authenticate('local-login', (err, user, info) => {
        if (err)
            return next(err);
        if (!user) {
            return res.status(info.code).send(info.message);
        }
        req.logIn(user, err => {
            if (err)
                return next(err);
            let returnTo = req.session.returnTo || '/';
            delete req.session.returnTo;
            res.json({status: 0, redirect: returnTo});
        });
    }, next)(req, res, next);
};

/**
 * Check if user is authenticated.
 */
exports.ensureAuthenticated = async (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
        return;
    }
    if (req.method !== 'GET')
        res.json({status: -1, message: 'You need to login first!'});
    else {
        req.session.returnTo = req.originalUrl;
        req.flash('login', 'You need to login first!');
        res.status(401).redirect('/');
    }
};

/**
 * Check if user is not authenticated.
 */
exports.ensureNotAuthenticated = async (req, res, next) => {
    if (!req.isAuthenticated()) {
        next();
        return;
    }
    if (req.method !== 'GET')
        res.json({status: -1, message: 'You already logged in!'});
    else {
        req.flash('login', 'You already logged in!');
        res.redirect('/');
    }
};