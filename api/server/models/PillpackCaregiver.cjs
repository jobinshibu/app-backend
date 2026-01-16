'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PillpackCaregiver extends Model {
    static associate(models) {
      PillpackCaregiver.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'patient'
      });

      PillpackCaregiver.belongsTo(models.Customer, {
        foreignKey: 'caregiver_id',
        as: 'caregiver'
      });
    }
  }

  PillpackCaregiver.init(
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
      caregiver_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      relation: {
        type: DataTypes.STRING(50),
        allowNull: true // e.g., "Son", "Daughter", "Nurse"
      },
      permissions: {
        type: DataTypes.TEXT, // JSON: ["view_adherence", "mark_taken", "manage_subscription"]
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
        defaultValue: 'pending'
      }
    },
    {
      sequelize,
      modelName: 'PillpackCaregiver',
      tableName: 'pillpack_caregivers',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at'
    }
  );

  return PillpackCaregiver;
};