const multer = require('multer');
const crypto = require('crypto');

/**
 * Set the save folder for avatars and rename rule.
 */
const storage = multer.diskStorage({
    destination: './public/images/avatars/',
    filename: (req, file, cb) => { // we use the md5 of user id as the filename
        cb(null, crypto.createHash('md5').update(req.user.local.user_id).digest('hex'))
    }
});
const upload = multer({storage: storage});

module.exports = upload;