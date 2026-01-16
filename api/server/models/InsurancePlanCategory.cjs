'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InsurancePlanCategory extends Model {
    static associate(models) {
      InsurancePlanCategory.belongsTo(models.InsurancePlan, {
        foreignKey: 'plan_id',
        as: 'plan'
      });

      InsurancePlanCategory.hasMany(models.InsurancePlanCategoryBenefit, {
        foreignKey: 'plan_category_id',
        as: 'benefits'
      });
    }
  }

  InsurancePlanCategory.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      plan_id: DataTypes.INTEGER,
      category_name: DataTypes.ENUM(
        "inpatient",
        "outpatient",
        "optical",
        "dental"
      ),
      description: DataTypes.TEXT,
      co_payment: DataTypes.BOOLEAN,
      co_payment_info: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: 'InsurancePlanCategory',
      tableName: 'insurance_plan_category',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );

  return InsurancePlanCategory;
};
