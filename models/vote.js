const mongoose = require('mongoose');

const VoteSchema = mongoose.Schema({
    user: {type: mongoose.Schema.ObjectId, ref: 'User', required: true},
    story: {type: mongoose.Schema.ObjectId, ref: 'Story', required: true},
    date: {type: Date, default: Date.now},
    star: {type: Number, required: true, enum: [1, 2, 3, 4, 5]}
});

module.exports = mongoose.model('Vote', VoteSchema);
