const path = require('path');
const fs = require('fs');

const User = require('../models/user');
const Story = require('../models/story');
const Vote = require('../models/vote');
const Ranking = require('../CollectiveIntelligence/Ranking');

const multer = require('../middlewares/multer-picture');

/**
 * Get all stories by json.
 */
exports.getAll = async (req, res) => {
    const stories = await Story.find().sort({date: -1})
        .populate({path: 'user', select: 'local.user_id local.name'}).exec();
    res.json(stories);
};

/**
 * Render new story page.
 */
exports.newPage = async (req, res) => {
    res.render('new', {title: 'New'});
};

/**
 * Render individual story page.
 */
exports.storyPage = async (req, res) => {
    const stories = await Story.find({_id: req.params.id}) // we use find instead of findOne here
        .populate({path: 'user', select: 'local.user_id local.name'}) // because we want to reuse index page
        .populate({path: 'votes.user', select: 'local.name'})
        .populate({path: 'votes.vote', select: 'star'}).exec();
    res.render('index', {title: 'Story', stories: stories, show: true});
};

/**
 * Create a new story and save.
 */
exports.newStory = async (req, res) => {
    let upload = multer.array('pictures', 3); // limit the number of upload files

    upload(req, res, async err => {
        if (err) {
            console.log(err);
            return res.json({status: -1});
        }

        let pics = [];
        req.files.forEach(element => pics.push(element.filename));

        if (req.body.new_story.length > 150) // check the length of story
            return res.json({status: -1});

        const newStory = await new Story({
            user: req.user._id,
            text: req.body.new_story,
            pictures: pics
        });
        newStory.save();

        const user = await User.findOne({_id: req.user._id}).exec(); // save story record for users
        user.stories.push(newStory);
        user.save();

        return res.status(201).json({status: 0, id: newStory._id});
    });
};

/**
 * Delete a story by ID.
 */
exports.delStory = async (req, res) => {
    const story = await Story.findOne({_id: req.params.id}).exec();
    if (story.user.toString() !== req.user._id.toString()) // different type here, we need to convert them to compare
        return res.json({status: -1, message: 'Can not delete others\' story!'});

    story.pictures.forEach(picture => { // delete pictures of this story if exists
        let file = path.join(__dirname, '../public/images/pictures', picture);
        fs.unlink(file, err => err ? console.log(err) : '');
    });

    const user = await User.findOne({_id: req.user._id}).exec(); // delete story record for users
    user.stories.pull(story._id); // but we do not delete vote record for users
    user.save(); // because the vote records can be used for recommendation algorithm

    await Story.deleteOne(story).exec(); // finally delete story
    res.json({status: 0});
};

/**
 * Recommending stories by user.
 */
exports.recommend = async (req, res) => {
    const critics = await User.find().populate({path: 'votes.vote', select: 'star'}).exec();
    let user = await User.findById(req.user._id).populate({path: 'votes.vote', select: 'star'}).exec();
    let ranking = new Ranking();
    let results = ranking.getRecommendations(critics, user);
    let stories = [];
    for (let result of results) {
        let story = await Story.findById(result.story).populate({path: 'user', select: 'local.user_id local.name'}).exec();
        stories.push(story);
    }
    // let stories = await Story.find({_id: {$in: results}})
    //     .populate({path: 'user', select: 'local.user_id local.name'}).exec();
    console.log('out', stories);
    res.json(stories);
};
