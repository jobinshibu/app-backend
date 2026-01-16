'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InsurancePlanSpeciality extends Model {
    static associate(models) {
      InsurancePlanSpeciality.belongsTo(models.InsurancePlan, {
        foreignKey: 'plan_id',
        as: 'plan'
      });
      InsurancePlanSpeciality.belongsTo(models.InsuranceSpeciality, {
        foreignKey: 'speciality_id',
        as: 'speciality'
      });
    }
  }

  InsurancePlanSpeciality.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      plan_id: DataTypes.INTEGER,
      speciality_id: DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: 'InsurancePlanSpeciality',
      tableName: 'insurance_plan_specialities',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );

  return InsurancePlanSpeciality;
};
