'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProfessionDepartment extends Model {
    static associate(models) {
      ProfessionDepartment.belongsTo(models.Profession, {
        foreignKey: 'proffession_id',
        as: 'professionInfo'
      });
      ProfessionDepartment.belongsTo(models.Department, {
        foreignKey: 'department_id',
        as: 'departmentInfo'
      });
       ProfessionDepartment.belongsTo(models.Establishment, {
        foreignKey: 'establishment_id',
        as: 'establishmentInfo'
      });
    }
  }
  ProfessionDepartment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      proffession_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      establishment_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'ProfessionDepartment',
      tableName: 'professions_departments',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return ProfessionDepartment;
};
