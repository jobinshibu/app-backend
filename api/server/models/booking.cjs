// Updated Booking Model
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      Booking.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
    }
  }

  Booking.init(
    {
      booking_id: DataTypes.STRING,
      customer_id: DataTypes.INTEGER,
      doctor_id: DataTypes.STRING,
      doctor_details: DataTypes.JSON,
      booking_date: DataTypes.DATE,
      time_slot: DataTypes.STRING,
      patient_name: DataTypes.STRING,
      patient_number: DataTypes.STRING,
      patient_age: DataTypes.STRING,
      patient_gender: DataTypes.STRING,
      consultation_fees: DataTypes.DOUBLE,
      other_charges: DataTypes.DOUBLE,
      total_bill: DataTypes.DOUBLE,
      discount_amount: DataTypes.DOUBLE,
      coupon_id: DataTypes.STRING,
      // insurance_id: DataTypes.STRING,
      hospital_details: DataTypes.JSON,
      in_person_visit_only: DataTypes.BOOLEAN,
      status: {
        type: DataTypes.STRING,
        defaultValue: '0',
        allowNull: false,
      },
      comments: {
        type: DataTypes.STRING(1000), // VARCHAR(1000)
        allowNull: true,
        defaultValue: null, // Default to null for optional comments
      },
      reminder_time: DataTypes.DATE,
      reminder_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      sequelize,
      modelName: 'Booking',
      tableName: 'bookings',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return Booking;
};