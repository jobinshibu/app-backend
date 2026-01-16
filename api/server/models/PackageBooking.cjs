'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PackageBooking extends Model {
    static associate(models) {
      PackageBooking.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
      PackageBooking.belongsTo(models.Package, {
        foreignKey: 'package_id',
        as: 'packageInfo'
      });
      PackageBooking.belongsTo(models.ShippingAddress, {
        foreignKey: 'customer_address_id',
        as: 'customerAddress'
      });
    }
  }

  PackageBooking.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      package_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
      // PRICE SNAPSHOT — LOCKED FOREVER
      package_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Price of main package at time of booking'
      },
      addons_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Total price of all add-ons at time of booking'
      },
      total_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Final amount customer paid (package + addons - discount)'
      },
      discount_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.00
      },
      // SNAPSHOT OF ADD-ONS (name + price at booking time)
      addons_snapshot: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: '[{mapping_id, name, price}] — never changes'
      },

      slot: {
        type: DataTypes.STRING,
        allowNull: true
      },
      booked_date: {
        type: DataTypes.STRING,
        allowNull: true
      },
      home_collection: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      payment_method: {
        type: DataTypes.STRING,
        allowNull: true
      },
      payment_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
      // insurance_id: {
      //   type: DataTypes.STRING,
      //   allowNull: true
      // },
      // insurance_details: {
      //   type: DataTypes.JSON,
      //   allowNull: true,
      //   comment: 'JSON object with insurance details'
      // },
      patient_name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      patient_age: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      patient_number: {
        type: DataTypes.STRING,
        allowNull: true
      },
      customer_address_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      customer_address_snapshot: {
        type: DataTypes.JSON,
        allowNull: true
      },
      coupon_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
      coupon_details: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'JSON object with coupon details'
      },
      booking_status: {
        type: DataTypes.INTEGER,
        defaultValue: 0, // 0 = pending, 1 = confirmed, 2 = cancelled, 3 = failed
        allowNull: false,
      },
      payment_status: {
        type: DataTypes.INTEGER,
        defaultValue: 0, // 0 = unpaid, 1 = paid
        allowNull: false,
        validate: {
          isIn: [[0, 1]]
        }
      },
      reminder_time: {
        type: DataTypes.DATE,
        allowNull: true
      },
      reminder_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      comments: {
        type: DataTypes.STRING(1000), // VARCHAR(1000)
        allowNull: true,
        defaultValue: null, // Default to null for optional comments
      },
      stripe_payment_intent_id: {
        type: DataTypes.STRING(1000),
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'PackageBooking',
      tableName: 'package_bookings',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );

  return PackageBooking;
};