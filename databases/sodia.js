const mongoose = require('mongoose');

const mongoDB = 'mongodb://localhost:27017/Sodia';

mongoose.Promise = global.Promise;

// try connect mongoDB
try {
    mongoose.connect(mongoDB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        checkServerIdentity: false,
        useCreateIndex: true
    });
} catch (e) {
    console.log('error in db connection: ' + e.message);
}
