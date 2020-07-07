const _ = require('lodash');
let Euclidean = require('./Euclidean');

module.exports = class Rank {

// Gets recommendations for a user by using a weighted average
// of every other user's rankings

    getRecommendations(users, userR) {
        let totals = {};
        let simSums = {};

        _.forIn(users, user => {
            // Don't compare me to myself
            if (userR._id.toString() === user._id.toString()) return;

            let sim = Euclidean.sim(userR, user);

            // Ignore scores of zero or lower
            if (sim <= 0) return;

            _.each(user.votes, record => {
                let story = record.story;
                console.log(record);
                let vote = record.vote;

                // Similarity * Score
                if (totals[story] === undefined) totals[story] = 0;
                totals[story] += vote.star * sim;

                // Sum of similarities
                if (simSums[story] === undefined) simSums[story] = 0;
                simSums[story] += sim;

            });
        });

        let scores = _.map(totals, (value, key) => {
            return {
                story: key,
                score: value / simSums[key]
            };
        });
        scores = _.sortBy(scores, 'score');
        return scores;
    }
}
