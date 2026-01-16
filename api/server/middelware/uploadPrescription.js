// ⭐ FULLY ESM SAFE FILE
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ensure upload directory exists
const uploadDir = 'upload/prescriptions/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ⭐ CHANGE: disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// ⭐ CHANGE: multer instance
const uploadPrescription = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files allowed'));
    }
    cb(null, true);
  }
});

export default uploadPrescription;
