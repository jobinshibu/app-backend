'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Benefit extends Model {
    static associate(models) {
      Benefit.hasMany(models.InsurancePlanCategoryBenefit, {
        foreignKey: 'benefit_id',
        as: 'planBenefits'
      });
    }
  }

  Benefit.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: DataTypes.STRING,
      description: DataTypes.TEXT
    },
    {
      sequelize,
      modelName: 'Benefit',
      tableName: 'benefits',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );

  return Benefit;
};
