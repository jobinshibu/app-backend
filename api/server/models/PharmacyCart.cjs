'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PharmacyCart extends Model {
    static associate(models) {
      // A cart belongs to a customer
      PharmacyCart.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer',
      });

      // A cart has many items
      PharmacyCart.hasMany(models.PharmacyCartItem, {
        foreignKey: 'cart_id',
        as: 'items',
        onDelete: 'CASCADE',
      });
    }
  }

  PharmacyCart.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'PharmacyCart',
      tableName: 'pharmacy_carts',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  return PharmacyCart;
};
