import express from 'express';
import pillpackController from '../controllers/pillpackController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

/* ============================
   MULTER CONFIG (UNCHANGED)
============================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'upload/prescriptions/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB (increased for PDFs)
  fileFilter: (req, file, cb) => {
    // ✅ ACCEPT IMAGES AND PDFs
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf'];
    
    if (allowedTypes.includes(file.mimetype) && allowedExts.includes(ext)) {
      return cb(null, true);
    }
    
    cb(new Error('Only JPG, JPEG, PNG images and PDF files are allowed.'));
  }
});

/* ============================
   PRESCRIPTIONS
============================ */
router.post('/prescriptions/upload', upload.single('prescription'), pillpackController.uploadPrescription);
router.get('/prescriptions', pillpackController.getMyPrescriptions);
router.get('/prescriptions/:prescriptionId', pillpackController.getPrescriptionDetails);

/* ============================
   PLACE ORDER (SUBSCRIPTION)
============================ */
router.post('/orders', pillpackController.placeOrder); // 🔥 RENAMED
router.get('/orders', pillpackController.getMyOrders);
router.patch('/orders/:orderId/pause', pillpackController.pauseSubscription);
router.patch('/orders/:orderId/resume', pillpackController.resumeSubscription);
router.delete('/orders/:orderId', pillpackController.cancelSubscription);

/* ============================
   ADHERENCE
============================ */
router.get('/adherence', pillpackController.getAdherenceCalendar);
router.patch('/adherence/:adherenceId/mark-taken', pillpackController.markDoseTaken);
router.get('/adherence/summary', pillpackController.getAdherenceSummary);

/* ============================
   CAREGIVERS
============================ */
router.post('/caregivers', pillpackController.addCaregiver);
router.get('/caregivers', pillpackController.getMyCaregivers);

export default router;
