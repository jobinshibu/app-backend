'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PharmacyOrder extends Model {
    static associate(models) {
      PharmacyOrder.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer',
      });

      PharmacyOrder.hasMany(models.PharmacyOrderItem, {
        foreignKey: 'order_id',
        as: 'items',
        onDelete: 'CASCADE',
      });
    }
  }

  PharmacyOrder.init(
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

      status: {
        type: DataTypes.ENUM(
          'pending',
          'paid',
          'confirmed',
          'dispatched',
          'delivered',
          'cancelled'
        ),
        defaultValue: 'pending',
      },

      payment_status: {
        type: DataTypes.ENUM('unpaid', 'paid', 'failed'),
        defaultValue: 'unpaid',
      },

      payment_method: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      payment_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'PharmacyOrder',
      tableName: 'pharmacy_orders',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  return PharmacyOrder;
};
