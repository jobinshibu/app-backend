import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './api/server/upload/hotelImage')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now().toString(), file.originalname);
    },
});

const multerFilter = (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
        cb(null, true);
    }
    else {
        cb("please upload right image");
    }
};

const UploadFile = multer({ storage: storage, fileFilter: multerFilter });
export default UploadFile 