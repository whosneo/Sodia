const mongoose = require('mongoose');

const StorySchema = mongoose.Schema({
    user: {type: mongoose.Schema.ObjectId, ref: 'User', required: true},
    date: {type: Date, default: Date.now},
    text: {type: String, required: true},
    pictures: [String],
    votes: [{
        user: {type: mongoose.Schema.ObjectId, ref: 'User'},
        vote: {type: mongoose.Schema.ObjectId, ref: 'Vote'}
    }]
});

module.exports = mongoose.model('Story', StorySchema);
