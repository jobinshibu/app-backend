'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DepartmentSpeciality extends Model {
    static associate(models) {
      DepartmentSpeciality.belongsTo(models.Specialities, {
        foreignKey: 'speciality_id',
        as: 'specialityInfo'
      });
    }
  }
  DepartmentSpeciality.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      dept_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      speciality_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'DepartmentSpeciality',
      tableName: 'department_specialties',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return DepartmentSpeciality;
};
