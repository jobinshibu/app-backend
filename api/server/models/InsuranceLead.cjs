'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InsuranceLead extends Model {
    static associate(models) {
      InsuranceLead.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
    }
  }

  InsuranceLead.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'customers', key: 'id' }
      },
      lead_type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: true
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      family_details: {
        type: DataTypes.JSON,
        allowNull: true
      },
      surgical_history: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      medical_history: {
        type: DataTypes.JSON, // Array of selected conditions
        allowNull: true
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
    },
    {
      sequelize,
      modelName: 'InsuranceLead',
      tableName: 'insurance_leads',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );

  return InsuranceLead;
};
