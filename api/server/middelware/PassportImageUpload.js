//-----------------------------------------
// passportImageUploader.js
//-----------------------------------------
import multer from 'multer';
import fs from 'fs';                  // ⭐ FIX
import path from 'path';

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = './upload/PassportImage';

    ensureDir(folder);               // ⭐ FIX
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '-' + Date.now() + path.extname(file.originalname)
    );
  }
});

const multerFilter = (req, file, cb) => {
  if (
    file.mimetype == 'image/png' ||
    file.mimetype == 'image/jpg' ||
    file.mimetype == 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb('please upload right image');
  }
};

const PassPortImageFile = multer({ storage: storage, fileFilter: multerFilter });
export default PassPortImageFile;
