'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NotificationPreference extends Model {
    static associate(models) {
      NotificationPreference.belongsTo(models.Customer, { 
        foreignKey: 'customer_id' ,
        as: "customer"
      });
    }
  }

  NotificationPreference.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // -----------------------------
      // APPOINTMENTS
      // -----------------------------
      appointment_confirmations: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      appointment_reminders: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      appointment_reschedule_cancel: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },

      // -----------------------------
      // LABS & REPORTS
      // -----------------------------
      report_ready_alerts: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      sample_collection_updates: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      lab_status_delays: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },

      // -----------------------------
      // PHARMACY & ORDERS
      // -----------------------------
      order_confirmations: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      out_for_delivery: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      refill_reminders: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },

      // -----------------------------
      // PAYMENTS & BILLS
      // -----------------------------
      payment_confirmations: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      pending_bills_refunds: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },

      // -----------------------------
      // HEALTH ALERTS & TIPS
      // -----------------------------
      preventive_health_reminders: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      seasonal_health_tips: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },

      // -----------------------------
      // PROMOS & OFFERS
      // -----------------------------
      promo_push: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      promo_whatsapp: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'NotificationPreference',
      tableName: 'notification_preferences',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );

  return NotificationPreference;
};