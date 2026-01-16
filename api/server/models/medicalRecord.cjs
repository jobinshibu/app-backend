'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MedicalRecord extends Model {
    static associate(models) {
      MedicalRecord.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customerInfo'
      });
      MedicalRecord.belongsTo(models.Family, {
        foreignKey: 'family_member_id',
        as: 'familyMemberInfo'
      });
    }
  }
  MedicalRecord.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_id: DataTypes.INTEGER,
    family_member_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    type: DataTypes.ENUM('Report', 'Prescription', 'Invoice'), // Changed to ENUM with allowed values
    created_on: DataTypes.DATE, // User-provided creation date
    record_created_date: DataTypes.DATE, // Auto-populated or from SQL ALTER
    added_for_id: DataTypes.INTEGER, // ID of the person it's added for (self or family)
    file: DataTypes.STRING, // Path to uploaded file (e.g., 'medicalRecords/filename.pdf')
    patient_name: DataTypes.STRING, // e.g., 'Arshad', 'Ahmed'
  }, {
    sequelize,
    modelName: 'MedicalRecord',
    tableName: 'medical_records',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    hooks: {
      beforeSave: (record) => {
        if (!record.record_created_date && record.created_on) {
          record.record_created_date = record.created_on; // Default to created_on if not set
        }
      }
    }
  });
  return MedicalRecord;
};