'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BundlePurchase extends Model {
    static associate(models) {
      BundlePurchase.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });

      BundlePurchase.belongsTo(models.PackageBundle, {
        foreignKey: 'bundle_id',
        as: 'bundle'
      });

      BundlePurchase.hasMany(models.BundlePurchaseItem, {
        foreignKey: 'purchase_id',
        as: 'items',
        onDelete: 'CASCADE'
      });

      BundlePurchase.hasMany(models.BundleUsageHistory, {
        foreignKey: 'purchase_id',
        sourceKey: 'id',
        as: 'usageHistory',
        scope: {
          // This ensures it goes through purchase_item
          // Optional — you can query via items instead
        }
      });
    }
  }

  BundlePurchase.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      bundle_id: {
        type: DataTypes.STRING(10),
        allowNull: false
      },
      purchase_date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      expiration_date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      payment_id: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('active', 'expired', 'cancelled', 'pending'),
        defaultValue: 'pending'
      }
    },
    {
      sequelize,
      modelName: 'BundlePurchase',
      tableName: 'bundle_purchases',
      underscored: true,
      timestamps: true,
      paranoid: false, // No soft delete needed
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return BundlePurchase;
};