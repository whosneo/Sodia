const User = require('../models/user');
const Story = require('../models/story');

const multer = require('../middlewares/multer-avatar');

/**
 * Render settings page.
 */
exports.getSettings = async (req, res) => {
    res.render('settings', {title: 'Settings'});
};

/**
 * Render user page.
 */
exports.userPage = async (req, res) => {
    const user = await User.findOne({'local.user_id': req.params.user_id}).exec();
    const stories = await Story.find({user: user._id}).sort({date: -1})
        .populate({path: 'user', select: 'local.user_id local.name'}).exec();
    res.render('index', {title: user.local.name, showUser: user, stories: stories, avatar: true});
};

/**
 * Update name for user.
 */
exports.updateName = async (req, res) => {
    let user = await User.findOneAndUpdate(
        {_id: req.user._id,},
        {'local.name': req.body.name},
        {new: true, runValidators: true}
    ).exec();
    if (user.local.name === req.body.name)
        res.json({status: 0});
    else
        res.json({status: -1});
};

/**
 * Update avatar for user.
 */
exports.updateAvatar = async (req, res) => {
    let upload = multer.single('avatar');

    upload(req, res, err => {
        if (err) {
            console.log(err);
            res.json({status: -1});
        } else
            res.json({status: 0});
    });
};

/**
 * Update password for user.
 */
exports.updatePassword = async (req, res) => {
    const password = req.body.password;
    let user = await User.findOne({_id: req.user._id,}).exec();
    user.setPassword(password);
    user.save();
    res.json({status: 0});
};