'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PillpackAdherence extends Model {
    static associate(models) {
      PillpackAdherence.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });

      PillpackAdherence.belongsTo(models.PillpackSubscription, {
        foreignKey: 'subscription_id',
        as: 'subscription'
      });
    }
  }

  PillpackAdherence.init(
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
      subscription_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      dose_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      time_slot: {
        type: DataTypes.ENUM('morning', 'afternoon', 'evening', 'night'),
        allowNull: false
      },
      scheduled_time: {
        type: DataTypes.TIME,
        allowNull: false
      },
      taken_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('pending', 'taken', 'missed', 'skipped'),
        defaultValue: 'pending'
      },
      reminder_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      reminder_sent_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'PillpackAdherence',
      tableName: 'pillpack_adherence',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: false
    }
  );

  return PillpackAdherence;
};