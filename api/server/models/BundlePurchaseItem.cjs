'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BundlePurchaseItem extends Model {
    static associate(models) {
      BundlePurchaseItem.belongsTo(models.BundlePurchase, {
        foreignKey: 'purchase_id',
        as: 'purchase'
      });

      BundlePurchaseItem.belongsTo(models.Package, {
        foreignKey: 'package_id',
        as: 'package'
      });

      BundlePurchaseItem.hasMany(models.BundleUsageHistory, {
        foreignKey: 'purchase_item_id',
        as: 'usageHistory'
      });
    }
  }

  BundlePurchaseItem.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      purchase_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      package_id: {
        type: DataTypes.STRING(10),
        allowNull: false
      },
      initial_qty: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      remaining_qty: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'BundlePurchaseItem',
      tableName: 'bundle_purchase_items',
      underscored: true,
      timestamps: true,
      paranoid: false,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return BundlePurchaseItem;
};