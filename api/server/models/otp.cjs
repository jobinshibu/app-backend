'use strict';
const { Model, Sequelize, DataTypes } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Otp extends Model {
    static associate(models) {
      // No associations needed for Otp at this stage
    }
  }
  
  Otp.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      fullMobile: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true // Ensures one active OTP per mobile number
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Otp',
      tableName: 'otps',
      updatedAt: 'updated_at',
      createdAt: 'created_at', // Disable default createdAt since we define it manually
      deletedAt: 'deleted_at',
      paranoid: true // Soft deletion to handle expired records if needed
    }
  );
  return Otp;
};