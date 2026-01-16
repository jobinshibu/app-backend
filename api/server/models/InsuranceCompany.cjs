'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InsuranceCompany extends Model {
    static associate(models) {
      InsuranceCompany.hasMany(models.InsuranceNetwork, {
        foreignKey: 'company_id',
        as: 'networks'
      });
      InsuranceCompany.hasMany(models.CustomerInsurance, {
        foreignKey: 'company_id',
        as: 'customerInsurances'
      });
    }
  }

  InsuranceCompany.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: DataTypes.STRING,
      logo_url: {
        type: DataTypes.STRING,
        get() {
          const rawValue = this.getDataValue('logo_url');
          return rawValue
            ? process.env.IMAGE_PATH + '/insurances/' + rawValue
            : null;
        }
      },
      description: DataTypes.TEXT,
      email: DataTypes.STRING,
      contact_number: DataTypes.STRING,
      support_hours: DataTypes.STRING, // e.g. "24/7"

    },
    {
      sequelize,
      modelName: 'InsuranceCompany',
      tableName: 'insurance_companies',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );

  return InsuranceCompany;
};
