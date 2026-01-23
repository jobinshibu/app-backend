'use strict';
const { Model } = require('sequelize');
const moment = require('moment');
module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    static associate(models) {
      // Customer.belongsTo(models.Insurance, {
      //   foreignKey: 'insurance_id',
      //   as: 'insuranceInfo'
      // });
      Customer.hasMany(models.Family, {
        foreignKey: 'customer_id',
        as: 'familyMembers'
      });
      Customer.hasMany(models.Notification, {
        foreignKey: 'customer_id',
        as: 'notifications'
      })
      Customer.hasMany(models.Payment, {
        foreignKey: 'user_id',
        as: 'payments'
      });
      Customer.hasMany(models.SavedCard, {
        foreignKey: 'user_id',
        as: 'savedCards'
      });
      Customer.hasOne(models.NotificationPreference, {
        foreignKey: "customer_id",
        as: "notificationPreference"
      });
      Customer.hasMany(models.CustomerInsurance, {
        foreignKey: 'customer_id',
        as: 'insurances'
      });
      Customer.hasOne(models.PharmacyCart, {
        foreignKey: 'customer_id',
        as: 'pharmacyCart',
      });

      Customer.hasMany(models.PharmacyOrder, {
        foreignKey: 'customer_id',
        as: 'pharmacyOrders',
      });

      Customer.hasMany(models.InsuranceLead, {
        foreignKey: 'customer_id',
        as: 'insuranceLeads'
      });

      Customer.hasMany(models.PillpackPrescription, {
        foreignKey: 'customer_id',
        as: 'pillpackPrescriptions'
      });

      Customer.hasMany(models.PillpackSubscription, {
        foreignKey: 'customer_id',
        as: 'pillpackSubscriptions'
      });

      Customer.hasMany(models.PillpackAdherence, {
        foreignKey: 'customer_id',
        as: 'pillpackAdherence'
      });

      Customer.hasMany(models.PillpackCaregiver, {
        foreignKey: 'customer_id',
        as: 'patients'
      });

      Customer.hasMany(models.PillpackCaregiver, {
        foreignKey: 'caregiver_id',
        as: 'caregivers'
      });
      Customer.hasMany(models.MyGarage, {
        foreignKey: 'customer_id',
        as: 'myGarage'
      });
    }
  }
  Customer.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      first_name: DataTypes.STRING,
      last_name: DataTypes.STRING,
      email: DataTypes.STRING,
      mobile_country_code: DataTypes.STRING,
      mobile_no: DataTypes.BIGINT,
      password: DataTypes.STRING,
      gender: DataTypes.STRING,
      dateOfBirth: DataTypes.DATE,
      nationality: DataTypes.STRING,
      age: DataTypes.INTEGER,
      image: DataTypes.STRING,
      otp: DataTypes.INTEGER,
      // insurance_id: DataTypes.INTEGER,
      device_token: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      stripe_customer_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

    },
    {
      sequelize,
      modelName: 'Customer',
      tableName: 'customers',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      hooks: {
        beforeSave: (customer) => {
          if (customer.dateOfBirth) {
            const dobMoment = moment(customer.dateOfBirth);
            const today = moment();
            customer.age = today.diff(dobMoment, 'years');
          }
        },
        beforeCreate: (customer) => {
          if (customer.dateOfBirth) {
            const dobMoment = moment(customer.dateOfBirth);
            const today = moment();
            customer.age = today.diff(dobMoment, 'years');
          }
        },
        beforeUpdate: (customer) => {
          if (customer.dateOfBirth) {
            const dobMoment = moment(customer.dateOfBirth);
            const today = moment();
            customer.age = today.diff(dobMoment, 'years');
          }
        },
        beforeBulkUpdate: (options) => {
          if (options?.attributes?.dateOfBirth) {
            const dobMoment = moment(options.attributes.dateOfBirth);
            const today = moment();
            options.attributes.age = today.diff(dobMoment, 'years');
          }
        }
      },
      paranoid: true
    }
  );
  return Customer;
};
