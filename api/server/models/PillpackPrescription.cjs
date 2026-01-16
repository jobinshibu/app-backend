'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PillpackPrescription extends Model {
    static associate(models) {
      // Make sure model names match EXACTLY
      PillpackPrescription.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });

      PillpackPrescription.hasMany(models.PillpackMedicine, {
        foreignKey: 'prescription_id',
        as: 'medicines'
      });

      PillpackPrescription.hasOne(models.PillpackSubscription, {
        foreignKey: 'prescription_id',
        as: 'subscription'
      });
    }
  }

  PillpackPrescription.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      prescription_file: {
        type: DataTypes.STRING(255),
        get() {
          const rawValue = this.getDataValue('prescription_file');
          return rawValue
            ? process.env.APP_IMAGE_PATH + '/prescriptions/' + rawValue
            : null;
        }
      },
      upload_method: {
        type: DataTypes.ENUM('camera', 'file', 'whatsapp'),
        defaultValue: 'camera'
      },
      doctor_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      doctor_license: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      prescription_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM(
          'pending',
          'verified',
          'rejected',
          'expired'
        ),
        defaultValue: 'pending'
      },
      verification_notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      verified_by: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      verified_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      ocr_data: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'PillpackPrescription',
      tableName: 'pillpack_prescriptions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at'
    }
  );

  return PillpackPrescription;
};