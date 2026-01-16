'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InsurancePlanEstablishment extends Model {
    static associate(models) {
      InsurancePlanEstablishment.belongsTo(models.InsurancePlan, {
        foreignKey: 'plan_id',
        as: 'plan'
      });

      InsurancePlanEstablishment.belongsTo(models.Establishment, {
        foreignKey: 'establishment_id',
        as: 'establishment'
      });
    }
  }

  InsurancePlanEstablishment.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      plan_id: DataTypes.INTEGER,
      establishment_id: DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: 'InsurancePlanEstablishment',
      tableName: 'insurance_plan_establishments',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );

  return InsurancePlanEstablishment;
};
