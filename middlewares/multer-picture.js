const multer = require('multer');

/**
 * Set the save folder for pictures and rename rule.
 */
const storage = multer.diskStorage({
    destination: './public/images/pictures/',
    filename: (req, file, cb) => {
        let filename = file.originalname.toLowerCase().split(' ').join('-');
        cb(null, Date.now() + '-' + filename) // we use the combination of date and original filename as filename
    }
});
const upload = multer({storage: storage});

module.exports = upload;