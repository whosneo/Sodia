const User = require('../models/user');
const Story = require('../models/story');
const Vote = require('../models/vote');

/**
 * Create new vote.
 */
exports.newVote = async (req, res) => {
    const vote = await new Vote({
        user: req.user._id,
        story: req.body.story,
        star: req.body.star
    });
    vote.save();

    const user = await User.findOne({_id: req.user._id}).exec();
    const story = await Story.findOne({_id: req.body.story}).exec();

    let update = false; // check if we need to create new one or update old one
    user.votes.forEach(record => {
        if (update)
            return;
        if (record.story.toString() === req.body.story.toString()) {
            record.vote = vote; // update here
            update = true;
        }
    });
    if (!update)
        user.votes.push({story, vote}); // create here
    user.save();

    update = false;
    story.votes.forEach(record => { // same as above, but for story
        if (update)
            return;
        if (record.user.toString() === req.user._id.toString()) {
            record.vote = vote;
            update = true;
        }
    });
    if (!update)
        story.votes.push({user, vote});
    story.save();

    res.status(201).json({status: 0});
};

/**
 * Get vote for specific story of some one user.
 */
exports.getVote = async (req, res) => { //GET /votes?story=id
    if (req.isAuthenticated() && req.query.story) { //find the latest vote
        const vote = await Vote.findOne({user: req.user._id, story: req.query.story}).sort({date: -1}).exec();
        if (vote)
            return res.json({status: 0, star: vote.star});
    }
    return res.json({status: 0, star: 0});
};
