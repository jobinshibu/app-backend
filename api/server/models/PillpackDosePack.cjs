'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PillpackDosePack extends Model {
    static associate(models) {
      PillpackDosePack.belongsTo(models.PillpackSubscription, {
        foreignKey: 'subscription_id',
        as: 'subscription'
      });
    }
  }

  PillpackDosePack.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      subscription_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      pack_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      time_slot: {
        type: DataTypes.ENUM('morning', 'afternoon', 'evening', 'night'),
        allowNull: false
      },
      medicines: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      qr_code: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      batch_number: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      packing_status: {
        type: DataTypes.ENUM('pending', 'packed', 'quality_checked', 'dispatched'),
        defaultValue: 'pending'
      },
      packed_by: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      packed_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'PillpackDosePack',
      tableName: 'pillpack_dose_packs',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: false
    }
  );

  return PillpackDosePack;
};