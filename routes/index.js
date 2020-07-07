const express = require('express');
const router = express.Router();

const appController = require('../controllers/app');
const authController = require('../controllers/auth');

/** Home page. */
router.all('/', appController.indexPage);
/** GET search page. */
router.get('/search', appController.searchPage);
/** POST search request. */
router.post('/search', appController.postSearch);
/** POST register request. */
router.post('/reg', authController.ensureNotAuthenticated, authController.postRegister);
/** POST login request. */
router.post('/login', authController.ensureNotAuthenticated, authController.postLogin);
/** Logout user. */
router.all('/logout', authController.logout);
/** Avatar of users. */
router.all('/images/avatars/:user_id', appController.getAvatar);

module.exports = router;
