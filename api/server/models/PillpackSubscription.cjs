'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PillpackSubscription extends Model {
    static associate(models) {
      PillpackSubscription.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });

      PillpackSubscription.belongsTo(models.PillpackPrescription, {
        foreignKey: 'prescription_id',
        as: 'prescription'
      });

      PillpackSubscription.hasMany(models.PillpackDosePack, {
        foreignKey: 'subscription_id',
        as: 'dosePacks'
      });
    }
  }

  PillpackSubscription.init(
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
      prescription_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      cycle_type: {
        type: DataTypes.ENUM('7_day', '15_day', '30_day', '90_day'),
        defaultValue: '30_day'
      },
      pack_type: {
        type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
        defaultValue: 'monthly'
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      next_refill_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      delivery_time_slot: {
        type: DataTypes.ENUM('morning', 'afternoon', 'evening'),
        defaultValue: 'morning'
      },
      status: {
        type: DataTypes.ENUM('active', 'paused', 'cancelled', 'expired'),
        defaultValue: 'active'
      },
      pause_reason: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      paused_from: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      paused_until: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      payment_method_id: {
        type: DataTypes.STRING(255), // Stripe payment method
        allowNull: true
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
      },
      auto_renew: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'PillpackSubscription',
      tableName: 'pillpack_subscriptions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at'
    }
  );

  return PillpackSubscription;
};