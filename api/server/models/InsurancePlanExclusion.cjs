'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InsurancePlanExclusion extends Model {
    static associate(models) {
      // Each exclusion belongs to one InsurancePlan
      InsurancePlanExclusion.belongsTo(models.InsurancePlan, {
        foreignKey: 'plan_id',
        as: 'plan'
      });
    }
  }

  InsurancePlanExclusion.init(
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
      exclusion_text: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'InsurancePlanExclusion',
      tableName: 'insurance_plan_exclusions',
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at'
    }
  );

  return InsurancePlanExclusion;
};