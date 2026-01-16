import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("checking image",file);
        if(file.fieldname == 'passportImage'){
            cb(null, './api/server/upload/PassportImage')
        }else{
            cb(null, './api/server/upload/hotelImage')
        }
    },
    filename: (req, file, cb) => {
        console.log("file4", file);
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },
});

const multerFilter = (req, file, cb) => {
    // console.log("file", file);
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
        cb(null, true);
    }
    else {
        cb("please upload right image");
    }
};

const hotelImageFile = multer({ storage: storage, fileFilter: multerFilter });
export default hotelImageFile;