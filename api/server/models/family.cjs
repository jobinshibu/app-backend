// models/family.js
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Family extends Model {
    static associate(models) {
      Family.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
    }
  }
  Family.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      image: DataTypes.STRING, // Path or URL
      gender: DataTypes.STRING,
      first_name: DataTypes.STRING,
      last_name: DataTypes.STRING,
      relation: DataTypes.STRING,
      customer_id: DataTypes.INTEGER, // FK to Customer

      // New fields added
      date_of_birth: DataTypes.DATE,
      visa_status: {
        type: DataTypes.ENUM,
        values: ['Residence', 'Tourist'],
        allowNull: true,
      },
      emirates_id_front: DataTypes.STRING, // Path to front side image
      emirates_id_back: DataTypes.STRING,  // Path to back side image
      emirates_id: DataTypes.STRING,
      emirates_date: DataTypes.DATE, // Visa expiry date
      nationality: DataTypes.STRING,
      passport_front: DataTypes.STRING, // Path to front side passport image
      passport_back: DataTypes.STRING,  // Path to back side passport image
      passport_id: DataTypes.STRING,    // Passport ID
      passport_date: DataTypes.DATE,    // Passport issue or expiry date

      verified: {
        type: DataTypes.INTEGER,
        defaultValue: false,
      },
      mobile_number: DataTypes.BIGINT, // New field for mobile number
      country_code: DataTypes.STRING,  // New field for country code
    },
    {
      sequelize,
      modelName: 'Family',
      tableName: 'families',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return Family;
};