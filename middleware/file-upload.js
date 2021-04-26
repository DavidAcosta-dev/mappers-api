const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
};

//configure multer to your specifications/needs
const fileUpload = multer({
    limits: 500000, //limiting the upload to 500,000bytes
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/images')
        },
        filename: (req, file, cb) => {
            const fileExtension = MIME_TYPE_MAP[file.mimetype];
            cb(null, uuidv4() + '.' + fileExtension);
        }
    }),
    fileFilter: (req, file, cb) => {
        const isValid = !!MIME_TYPE_MAP[file.mimetype];
        let error = isValid ? null : new Error('Invalid mime type!');
        cb(error, isValid);
    }
});

module.exports = fileUpload;