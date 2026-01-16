'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InsurancePlan extends Model {
    static associate(models) {
      InsurancePlan.belongsTo(models.InsuranceNetwork, {
        foreignKey: 'network_id',
        as: 'network'
      });

      InsurancePlan.hasMany(models.InsurancePlanCategory, {
        foreignKey: 'plan_id',
        as: 'categories'
      });

      InsurancePlan.hasMany(models.InsurancePlanEstablishment, {
        foreignKey: 'plan_id',
        as: 'establishments'
      });

      InsurancePlan.hasMany(models.CustomerInsurance, {
        foreignKey: 'plan_id',
        as: 'customerInsurances'
      });

      // New tables – one-to-many
      InsurancePlan.hasMany(models.InsurancePlanClaimStep, {
        foreignKey: 'plan_id',
        as: 'claimSteps'
      });

      InsurancePlan.hasMany(models.InsurancePlanExclusion, {
        foreignKey: 'plan_id',
        as: 'exclusions'
      });

      InsurancePlan.hasMany(models.InsurancePlanHighlight, {
        foreignKey: 'plan_id',
        as: 'highlights'
      });
      InsurancePlan.belongsToMany(models.InsuranceSpeciality, {
        through: models.InsurancePlanSpeciality,
        foreignKey: 'plan_id',
        otherKey: 'speciality_id',
        as: 'planSpecialities'
      });
        }
  }

  InsurancePlan.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      network_id: DataTypes.INTEGER,
      name: DataTypes.STRING,
      annual_limit: DataTypes.STRING,
      area_of_cover: DataTypes.STRING,
      sub_title: DataTypes.STRING,
      description: DataTypes.TEXT,
      selling_price: DataTypes.DECIMAL(10, 2),
      strike_price: DataTypes.DECIMAL(10, 2),
      cover_amount: DataTypes.DECIMAL(15, 2),
      features: DataTypes.JSON,
      discount_text: DataTypes.STRING,
      special_for_customers: DataTypes.BOOLEAN,
      recommended: DataTypes.BOOLEAN,
      is_dha_approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      eligibility: {
        type: DataTypes.JSON,
        comment: 'Eligibility rules for the plan'
      },
      policy_term_years: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      is_renewable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
    },
    {
      sequelize,
      modelName: 'InsurancePlan',
      tableName: 'insurance_plans',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );

  return InsurancePlan;
};