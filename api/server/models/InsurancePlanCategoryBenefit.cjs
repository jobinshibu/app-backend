'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InsurancePlanCategoryBenefit extends Model {
    static associate(models) {
      InsurancePlanCategoryBenefit.belongsTo(models.InsurancePlanCategory, {
        foreignKey: 'plan_category_id',
        as: 'planCategory'
      });

      InsurancePlanCategoryBenefit.belongsTo(models.Benefit, {
        foreignKey: 'benefit_id',
        as: 'benefit'
      });
    }
  }

  InsurancePlanCategoryBenefit.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      plan_category_id: DataTypes.INTEGER,
      benefit_id: DataTypes.INTEGER,
      included: DataTypes.BOOLEAN,
      notes: DataTypes.TEXT
    },
    {
      sequelize,
      modelName: 'InsurancePlanCategoryBenefit',
      tableName: 'insurance_plan_category_benefits',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );

  return InsurancePlanCategoryBenefit;
};
