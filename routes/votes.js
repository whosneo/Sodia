const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth');
const voteController = require('../controllers/vote');

/** POST /votes for creating new vote. */
router.post('/', authController.ensureAuthenticated, voteController.newVote);
/** /GET /votes?story=id for getting vote for specific story. */
router.get('/', voteController.getVote);

module.exports = router;