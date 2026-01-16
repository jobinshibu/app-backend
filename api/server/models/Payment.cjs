'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.Customer, {
        foreignKey: 'user_id',
        as: 'userInfo'
      });
    }
  }

  Payment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'customers',  // ← Use table name, not model name
          key: 'id'
        }
      },
      stripe_payment_intent_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(10),
        defaultValue: 'usd',
      },
      status: {
        type: DataTypes.ENUM(
          'pending',
          'completed',
          'failed',
          'refunded',
          'cancelled',
          'requires_payment_method',
          'requires_confirmation',
          'requires_action',
          'processing',
          'requires_capture'
        ),
        defaultValue: 'pending',
      },
      payment_method: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      booking_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      booking_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      receipt_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      refund_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      refund_reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      failure_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Payment',
      tableName: 'payments',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
    }
  );

  return Payment;
};