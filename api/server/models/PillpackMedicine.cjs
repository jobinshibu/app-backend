'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PillpackMedicine extends Model {
    static associate(models) {
      PillpackMedicine.belongsTo(models.PillpackPrescription, {
        foreignKey: 'prescription_id',
        as: 'prescription'
      });

      PillpackMedicine.belongsTo(models.PharmacyProduct, {
        foreignKey: 'product_id',
        as: 'product'
      });

      PillpackMedicine.belongsTo(models.Establishment, {
        foreignKey: 'pharmacy_id',
        as: 'pharmacy'
      });
    }
  }

  PillpackMedicine.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      prescription_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      pharmacy_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      medicine_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      dosage: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      frequency: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      timing: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      quantity_prescribed: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      duration_days: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      instructions: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      is_controlled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'mapped', 'out_of_stock', 'discontinued'),
        defaultValue: 'pending'
      }
    },
    {
      sequelize,
      modelName: 'PillpackMedicine',
      tableName: 'pillpack_medicines',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at'
    }
  );

  return PillpackMedicine;
};