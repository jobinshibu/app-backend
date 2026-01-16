//-----------------------------------------
// uploadFamilyImages.js
//-----------------------------------------
import multer from 'multer';
import path from 'path';
import fs from 'fs';                   // ⭐ FIX

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });     // ⭐ FIX
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {

        let folder = '';

        if (file.fieldname === 'image') {
            folder = './upload/familyImages/';
        } 
        else if (file.fieldname === 'emirates_id_front') {
            folder = './upload/emiratesIdFront/';
        } 
        else if (file.fieldname === 'emirates_id_back') {
            folder = './upload/emiratesIdBack/';
        }
        else if (file.fieldname === 'passport_front') {
            folder = './upload/passportFront/';     // ⭐ FIX (previously reused emirates folder!)
        }
        else if (file.fieldname === 'passport_back') {
            folder = './upload/passportBack/';      // ⭐ FIX
        }

        ensureDir(folder);                           // ⭐ FIX

        cb(null, folder);
    },

    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PNG, JPG, and JPEG images are allowed'), false);
    }
};

const uploadFamilyImages = multer({
    storage: storage,
    fileFilter: fileFilter
}).fields([
    { name: 'image', maxCount: 1 },
    { name: 'emirates_id_front', maxCount: 1 },
    { name: 'emirates_id_back', maxCount: 1 },
    { name: 'passport_front', maxCount: 1 },
    { name: 'passport_back', maxCount: 1 }
]);

export default uploadFamilyImages;