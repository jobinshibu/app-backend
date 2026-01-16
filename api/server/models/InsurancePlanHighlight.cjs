'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InsurancePlanHighlight extends Model {
    static associate(models) {
      // Each highlight belongs to one InsurancePlan
      InsurancePlanHighlight.belongsTo(models.InsurancePlan, {
        foreignKey: 'plan_id',
        as: 'plan'
      });
    }
  }

  InsurancePlanHighlight.init(
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
      title: {
        type: DataTypes.STRING,
        allowNull: false
        // example: "90+ Cashless hospitals"
      },
      icon: {
        type: DataTypes.STRING,
        allowNull: true
        // icon key / name / class
      },
      action_type: {
        type: DataTypes.STRING,
        allowNull: true
        // "view_list" | "view_details" | null
      },
      order_no: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      sequelize,
      modelName: 'InsurancePlanHighlight',
      tableName: 'insurance_plan_highlights',
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at'
    }
  );

  return InsurancePlanHighlight;
};