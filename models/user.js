const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = mongoose.Schema({
    local: {
        email: {type: String, required: true, unique: true, lowercase: true, trim: true, max: 50},
        user_id: {type: String, required: true, unique: true, max: 50},
        name: {type: String, required: true, trim: true, max: 100},
        salt: {type: String, required: true},
        hash: {type: String, required: true},
    },
    stories: [{
        type: mongoose.Schema.ObjectId, ref: 'Story'
    }],
    votes: [{
        story: {type: mongoose.Schema.ObjectId, ref: 'Story'},
        vote: {type: mongoose.Schema.ObjectId, ref: 'Vote'}
    }]
});

/**
 * Set password for user.
 */
UserSchema.methods.setPassword = function (password) { // Can not use arrow function here
    this.local.salt = crypto.randomBytes(8).toString('hex');
    this.local.hash = crypto.pbkdf2Sync(password, this.local.salt, 10000, 256, 'sha256').toString('hex');
};

/**
 * Check password for user.
 */
UserSchema.methods.validatePassword = function (password) {
    const hash = crypto.pbkdf2Sync(password, this.local.salt, 10000, 256, 'sha256').toString('hex');
    return this.local.hash === hash;
};

module.exports = mongoose.model('User', UserSchema);
