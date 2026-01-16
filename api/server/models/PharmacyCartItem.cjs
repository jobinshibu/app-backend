'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PharmacyCartItem extends Model {
    static associate(models) {
      PharmacyCartItem.belongsTo(models.PharmacyCart, {
        foreignKey: 'cart_id',
        as: 'cart',
      });

      PharmacyCartItem.belongsTo(models.PharmacyProduct, {
        foreignKey: 'product_id',
        as: 'product',
      });

      PharmacyCartItem.belongsTo(models.Establishment, {
        foreignKey: 'pharmacy_id',
        as: 'pharmacy',
      });
    }
  }

  PharmacyCartItem.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      cart_id: {
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
    },
    {
      sequelize,
      modelName: 'PharmacyCartItem',
      tableName: 'pharmacy_cart_items',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  return PharmacyCartItem;
};
