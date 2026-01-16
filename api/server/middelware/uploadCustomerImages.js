//-----------------------------------------
// uploadCustomerImages.js
//-----------------------------------------
import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';                     // ⭐ FIX
import { promises as fsp } from 'fs';   // keep your async file ops

// ⭐ FIX: ensure folder exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = './upload/customerImages/';
    ensureDir(folder);              // ⭐ FIX added
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

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('image');

const uploadCustomerImages = async (req, res, next) => {
  console.time('uploadCustomerImages');
  upload(req, res, async (err) => {
    if (err) {
      console.timeEnd('uploadCustomerImages');
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      console.timeEnd('uploadCustomerImages');
      return next();
    }

    const inputPath = req.file.path;
    const tempOutputPath = `${inputPath}.tmp`;

    try {
      await sharp(inputPath)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(tempOutputPath);

      await fsp.rename(tempOutputPath, inputPath);

      const stats = await fsp.stat(inputPath);
      req.file.size = stats.size;

      console.timeEnd('uploadCustomerImages');
      next();
    } catch (sharpErr) {
      console.error('Sharp failed:', sharpErr);

      await Promise.all([
        fsp.unlink(inputPath).catch(() => { }),
        fsp.unlink(tempOutputPath).catch(() => { })
      ]);

      console.timeEnd('uploadCustomerImages');
      return res.status(500).json({ message: 'Image processing failed' });
    }
  });
};

export default uploadCustomerImages;