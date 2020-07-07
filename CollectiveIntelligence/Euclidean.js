const _ = require('lodash');

module.exports = class Euclidean {

    // Returns a distance-based similarity score for user1 and user2
    static sim(user1, user2) {
        // Get the list of shared_items
        let user1Stories = _.map(user1.votes, vote => {
            return vote.story.toString();
        });
        let user2Stories = _.map(user2.votes, vote => {
            return vote.story.toString();
        });
        let sharedStories = _.intersection(user1Stories, user2Stories);

        // If they have no ratings in common, return 0
        if (sharedStories.length === 0) return 0;

        // Add up the squares of all the differences
        let sum = 0;
        _.forEach(sharedStories, story => {
            let user1Vote = _.find(user1.votes, record => {
                if (record.story.toString() === story.toString()) return record;
            }).vote.star;
            let user2Vote = _.find(user2.votes, record => {
                if (record.story.toString() === story.toString()) return record;
            }).vote.star;
            let calc = Math.pow(user1Vote - user2Vote, 2);
            sum += calc;
        });

        return 1 / (1 + sum);

    }

}
