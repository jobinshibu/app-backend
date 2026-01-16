'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BundleUsageHistory extends Model {
    static associate(models) {
      BundleUsageHistory.belongsTo(models.BundlePurchaseItem, {
        foreignKey: 'purchase_item_id',
        as: 'purchaseItem'
      });

      BundleUsageHistory.belongsTo(models.PackageBooking, {
        foreignKey: 'booking_id',
        as: 'booking'
      });
    }
  }

  BundleUsageHistory.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      purchase_item_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      booking_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      usage_date: {
        type: DataTypes.DATE,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'BundleUsageHistory',
      tableName: 'bundle_usage_history',
      underscored: true,
      timestamps: true,
      paranoid: false,
      createdAt: 'created_at',
      updatedAt: false
    }
  );

  return BundleUsageHistory;
};