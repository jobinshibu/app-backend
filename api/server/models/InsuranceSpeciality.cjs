'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InsuranceSpeciality extends Model {
    static associate(models) {
      InsuranceSpeciality.belongsToMany(models.InsurancePlan, {
        through: models.InsurancePlanSpeciality,
        foreignKey: 'speciality_id',
        otherKey: 'plan_id',
        as: 'specialityPlans'
      });
    }
  }

  InsuranceSpeciality.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: DataTypes.STRING,
      icon: {
        type: DataTypes.STRING,
        get() {
          const rawValue = this.getDataValue('icon');
          return rawValue
            ? process.env.IMAGE_PATH + '/insurance-specialities/' + rawValue
            : null;
        }
      },
        description: DataTypes.TEXT
    },
    {
      sequelize,
      modelName: 'InsuranceSpeciality',
      tableName: 'insurance_specialities',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );

  return InsuranceSpeciality;
};
