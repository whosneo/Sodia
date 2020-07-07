const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');
const session = require('express-session');
const favicon = require('serve-favicon');
const flash = require('connect-flash');

// import passport and mongoose
require('./middlewares/passport')(passport);
require('./databases/sodia');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'foobar',
    resave: true,
    saveUninitialized: true
}));
app.use(flash());

// initialize passport
app.use(passport.initialize(undefined));
app.use(passport.session(undefined));

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// set global view variables
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.message = null;
    next();
});

// assign different paths to routers
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const storiesRouter = require('./routes/stories');
const votesRouter = require('./routes/votes');

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/stories', storiesRouter);
app.use('/votes', votesRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => next(createError(404)));

// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
