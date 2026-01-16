import httpStatus from 'http-status';
import APIResponse from '../utils/APIResponse.js';
import db from '../models/index.js';
import medicalRecordUpload from '../middelware/medicalRecordUpload.js';

const MedicalRecord = db.MedicalRecord;

class MedicalRecordController {
  // Middleware wrapper for upload (to handle errors)
  async uploadFile(req, res, next) {
    medicalRecordUpload(req, res, (err) => {
      if (err) {
        return res.status(httpStatus.BAD_REQUEST).json(new APIResponse({}, err.message, httpStatus.BAD_REQUEST));
      }
      next();
    });
  }

  async addMedicalRecord(req, res) {
    try {
      const { customer_id, family_member_id, title, type, created_on, added_for_id ,patient_name} = req.body;
      const files = req.files; // Array of files from multer

      if (!files || files.length === 0) {
        return res.status(httpStatus.BAD_REQUEST).json(new APIResponse({}, 'No files uploaded.', httpStatus.BAD_REQUEST));
      }

      // Map file paths
      const filePaths = files.map(file => `${process.env.IMAGE_PATH_URL || 'http://13.126.236.126:8084/'}/medicalRecords/${file.filename}`);

      const record = await MedicalRecord.create({
        customer_id,
        family_member_id,
        title,
        type,
        created_on,
        added_for_id,
        patient_name: patient_name || null, // Ensure patient_name is set, default to null if undefined
        file: JSON.stringify(filePaths), // Store as JSON array in the file column
        
      });

      return res.status(httpStatus.CREATED).json(new APIResponse(record, 'Medical record added successfully.', httpStatus.CREATED));
    } catch (error) {
      console.error('addMedicalRecord error:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new APIResponse({}, 'Failed to add medical record.', httpStatus.INTERNAL_SERVER_ERROR));
    }
  }

async getMedicalRecords(req, res) {
  try {
    const { customer_id } = req.query;
    if (!customer_id) {
      return res.status(httpStatus.BAD_REQUEST).json(new APIResponse({}, 'customer_id is required.', httpStatus.BAD_REQUEST));
    }

    const records = await MedicalRecord.findAll({
      where: { customer_id },
      include: [
        { 
          model: db.Customer, 
          as: 'customerInfo', 
          attributes: ['id', 'first_name', 'last_name'] 
        },
        { 
          model: db.Family, 
          as: 'familyMemberInfo', 
          attributes: ['id', 'first_name', 'last_name', 'relation'] // Use actual fields
        },
      ],
      order: [['created_on', 'DESC']],
    });

    const groupedRecords = records.reduce((acc, record) => {
      const year = new Date(record.created_on).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(record);
      return acc;
    }, {});

    return res.status(httpStatus.OK).json(new APIResponse(groupedRecords, 'Medical records fetched successfully.', httpStatus.OK));
  } catch (error) {
    console.error('getMedicalRecords error:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new APIResponse({}, 'Failed to fetch medical records.', httpStatus.INTERNAL_SERVER_ERROR));
  }
}
async getMedicalRecordById(req, res) {
  try {
    const { id } = req.params;
    const record = await MedicalRecord.findByPk(id, {
      include: [
        { 
          model: db.Customer, 
          as: 'customerInfo', 
          attributes: ['id', 'first_name', 'last_name'] 
        },
        { 
          model: db.Family, 
          as: 'familyMemberInfo', 
          attributes: ['id', 'first_name', 'last_name', 'relation'] // Use actual fields
        },
      ],
    });

    if (!record) {
      return res.status(httpStatus.NOT_FOUND).json(new APIResponse({}, 'Medical record not found.', httpStatus.NOT_FOUND));
    }

    return res.status(httpStatus.OK).json(new APIResponse(record, 'Medical record fetched successfully.', httpStatus.OK));
  } catch (error) {
    console.error('getMedicalRecordById error:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new APIResponse({}, 'Failed to fetch medical record.', httpStatus.INTERNAL_SERVER_ERROR));
  }
}

async updateMedicalRecord(req, res) {
  try {
    const { id } = req.params;
    const { title, type, created_on, added_for_id, patient_name } = req.body;
    const files = req.files; // Handle multiple files for update

    const record = await MedicalRecord.findByPk(id);
    if (!record) {
      return res.status(httpStatus.NOT_FOUND).json(new APIResponse({}, 'Medical record not found.', httpStatus.NOT_FOUND));
    }

    let filePaths = JSON.parse(record.file || '[]'); // Get existing files
    if (files && files.length > 0) {
      const newFilePaths = files.map(file => `medicalRecords/${file.filename}`);
      filePaths = [...filePaths, ...newFilePaths]; // Append new files
    }

    await record.update({
      title,
      type,
      created_on,
      added_for_id,
      patient_name: patient_name || null, // Ensure patient_name is set, default to null if undefined
      file: JSON.stringify(filePaths),
    });

    return res.status(httpStatus.OK).json(new APIResponse(record, 'Medical record updated successfully.', httpStatus.OK));
  } catch (error) {
    console.error('updateMedicalRecord error:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new APIResponse({}, 'Failed to update medical record.', httpStatus.INTERNAL_SERVER_ERROR));
  }
}

  async deleteMedicalRecord(req, res) {
    try {
      const { id } = req.params;
      const record = await MedicalRecord.findByPk(id);
      if (!record) {
        return res.status(httpStatus.NOT_FOUND).json(new APIResponse({}, 'Medical record not found.', httpStatus.NOT_FOUND));
      }

      await record.destroy(); // Soft delete due to paranoid: true

      return res.status(httpStatus.OK).json(new APIResponse({}, 'Medical record deleted successfully.', httpStatus.OK));
    } catch (error) {
      console.error('deleteMedicalRecord error:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new APIResponse({}, 'Failed to delete medical record.', httpStatus.INTERNAL_SERVER_ERROR));
    }
  }
}

export default new MedicalRecordController();