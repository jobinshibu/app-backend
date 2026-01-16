'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InsuranceNetwork extends Model {
    static associate(models) {
      InsuranceNetwork.belongsTo(models.InsuranceCompany, {
        foreignKey: 'company_id',
        as: 'company'
      });
      InsuranceNetwork.hasMany(models.InsurancePlan, {
        foreignKey: 'network_id',
        as: 'plans'
      });
      InsuranceNetwork.hasMany(models.CustomerInsurance, {
        foreignKey: 'network_id',
        as: 'customerInsurances'
      });
    }
  }

  InsuranceNetwork.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      company_id: DataTypes.INTEGER,
      name: DataTypes.STRING
    },
    {
      sequelize,
      modelName: 'InsuranceNetwork',
      tableName: 'insurance_networks',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );

  return InsuranceNetwork;
};
