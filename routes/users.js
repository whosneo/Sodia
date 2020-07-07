const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth');
const userController = require('../controllers/user');

/** GET /users/settings for  */
router.get('/settings', authController.ensureAuthenticated, userController.getSettings);
/** POST /users/settings/name for updating name for user. */
router.post('/settings/name', authController.ensureAuthenticated, userController.updateName);
/** POST /users/settings/avatar for updating avatar for user. */
router.post('/settings/avatar', authController.ensureAuthenticated, userController.updateAvatar);
/** POST /users/settings/password for updating password for user. */
router.post('/settings/password', authController.ensureAuthenticated, userController.updatePassword);
/** GET /users/user_id for user page. */
router.get('/:user_id', userController.userPage);

module.exports = router;
