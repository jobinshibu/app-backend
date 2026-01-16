'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PharmacyOrderItem extends Model {
    static associate(models) {
      PharmacyOrderItem.belongsTo(models.PharmacyOrder, {
        foreignKey: 'order_id',
        as: 'order',
      });

      PharmacyOrderItem.belongsTo(models.PharmacyProduct, {
        foreignKey: 'product_id',
        as: 'product',
      });

      PharmacyOrderItem.belongsTo(models.Establishment, {
        foreignKey: 'pharmacy_id',
        as: 'pharmacy',
      });
    }
  }

  PharmacyOrderItem.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      pharmacy_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'PharmacyOrderItem',
      tableName: 'pharmacy_order_items',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  return PharmacyOrderItem;
};
