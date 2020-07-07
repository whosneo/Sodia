const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const Story = require('../models/story');

/**
 * Render index page with all stories.
 */
exports.indexPage = async (req, res) => {
    const stories = await Story.find().sort({date: -1})
        .populate({path: 'user', select: 'local.user_id local.name'}).exec();
    res.render('index', {title: 'Home', stories: stories, message: req.flash('login'), home: true});
};

/**
 * Render search page.
 */
exports.searchPage = async (req, res) => {
    res.render('search', {title: 'Search'});
};

/**
 * Search stories by keyword and send result by json.
 */
exports.postSearch = async (req, res) => {
    const stories = await Story.find({text: {$regex: req.body.query, $options: 'i'}}, null).sort({date: 1})
        .populate({path: 'user', select: 'local.user_id local.name'}).exec();
    res.json(stories);
};

/**
 * Get avatars of users by ID.
 */
exports.getAvatar = async (req, res) => {
    const filename = crypto.createHash('md5').update(req.params.user_id).digest('hex');
    const file = path.join(__dirname, '../public/images/avatars', filename);
    if (fs.existsSync(file))
        res.sendFile(file);
    else
        res.sendFile(path.join(__dirname, '../public/images/avatars', 'default.png'));
};