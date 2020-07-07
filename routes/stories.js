const express = require('express');
const router = express.Router();

const storyController = require('../controllers/story');
const authController = require('../controllers/auth');

// we use restful design here
/** GET /stories for getting all stories. */
router.get('/', storyController.getAll);
/** POST /stories for creating new story. */
router.post('/', authController.ensureAuthenticated, storyController.newStory);
/** GET new story page. */
router.get('/new', authController.ensureAuthenticated, storyController.newPage);
/** GET /stories/id for getting specific story. */
router.get('/:id', storyController.storyPage);
/** DELETE /stories/id for deleting specific story. */
router.delete('/:id', authController.ensureAuthenticated, storyController.delStory);
/** POST /stories/recommend for recommending stories */
router.post('/recommend', authController.ensureAuthenticated, storyController.recommend);

module.exports = router;