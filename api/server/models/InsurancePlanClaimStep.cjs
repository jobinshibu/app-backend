'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InsurancePlanClaimStep extends Model {
    static associate(models) {
      // Each claim step belongs to one InsurancePlan
      InsurancePlanClaimStep.belongsTo(models.InsurancePlan, {
        foreignKey: 'plan_id',
        as: 'plan'
      });
    }
  }

  InsurancePlanClaimStep.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      plan_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      step_no: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'InsurancePlanClaimStep',
      tableName: 'insurance_plan_claim_steps',
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at'
    }
  );

  return InsurancePlanClaimStep;
};