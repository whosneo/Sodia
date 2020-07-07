const LocalStrategy = require('passport-local/lib').Strategy;
const User = require('../models/user');

module.exports = passport => {
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and deserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser((user, done) => done(null, user.id));

    // used to deserialize the user
    passport.deserializeUser((id, done) => User.findOne({_id: id}).exec((err, user) => done(err, user)));

    // =========================================================================
    // LOCAL REGISTER ==========================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for register
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-reg', new LocalStrategy({
            usernameField: 'email', // we will override username with email
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        }, async (req, email, password, done) => {
            const user_id = req.body.user_id;
            const username = req.body.nickname;
            const passwordAgain = req.body.passwordAgain;

            if (password !== passwordAgain)
                return done(null, false, {code: 400, message: 'Repeat password does not match.'});

            // find a user whose email is same
            let user1 = await User.findOne({'local.email': email}).exec();

            if (user1) // check to see if there is already a user with that email
                return done(null, false, {code: 400, message: 'That email is already taken.'});

            // find a user whose user_id is same
            let user2 = await User.findOne({'local.user_id': user_id}).exec();

            if (user2) // check to see if there is already a user with that user_id
                return done(null, false, {code: 400, message: 'That user ID is already taken.'})

            // if there is no user with that email or username, create the user
            const user = new User({
                'local.email': email,
                'local.user_id': user_id,
                'local.name': username
            });
            user.setPassword(password);

            // save the user
            user.save();
            return done(null, user);
        }
    ));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================

    passport.use('local-login', new LocalStrategy({
            usernameField: 'email', // we will override username with email
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        }, async (req, email, password, done) => { // callback with email and password from our form
            const user = await User.findOne({'local.email': email}).exec(); // find a user whose email is same
            if (!user || !user.validatePassword(password)) // if no user is found or invalid password, return the message
                return done(null, false, {code: 401, message: 'Invalid email or password.'});
            return done(null, user); // all is well, return successful user
        })
    );
};
