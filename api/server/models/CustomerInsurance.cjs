'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CustomerInsurance extends Model {
    static associate(models) {
      CustomerInsurance.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });

      CustomerInsurance.belongsTo(models.InsuranceCompany, {
        foreignKey: 'company_id',
        as: 'company'
      });

      CustomerInsurance.belongsTo(models.InsuranceNetwork, {
        foreignKey: 'network_id',
        as: 'network'
      });

      CustomerInsurance.belongsTo(models.InsurancePlan, {
        foreignKey: 'plan_id',
        as: 'plan'
      });
    }
  }

  CustomerInsurance.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

      customer_id: DataTypes.INTEGER,
      company_id: DataTypes.INTEGER,
      network_id: DataTypes.INTEGER,
      plan_id: DataTypes.INTEGER,

      policy_number: DataTypes.STRING,
      policy_holder_name: DataTypes.STRING,

      start_date: DataTypes.DATEONLY,
      end_date: DataTypes.DATEONLY,

      status: {
        type: DataTypes.ENUM('ACTIVE', 'EXPIRED', 'CANCELLED'),
        defaultValue: 'ACTIVE'
      },

      policy_type: {
        type: DataTypes.ENUM('INDIVIDUAL', 'FAMILY'),
        defaultValue: 'INDIVIDUAL'
      }
    },
    {
      sequelize,
      modelName: 'CustomerInsurance',
      tableName: 'customer_insurances',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return CustomerInsurance;
};
