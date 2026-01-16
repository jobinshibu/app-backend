'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Department extends Model {
    static associate(models) {
      Department.belongsTo(models.Establishment, {
        foreignKey: 'establishment_id',
        as: 'establishmentInfo'
      });
      
      Department.hasMany(models.DepartmentWorkingHour, {
        foreignKey: 'department_id',
        as: 'workingHoursDetails'
      });
      //   Department.hasMany(models.professions_department, {
      //     foreignKey: 'department_id',
      //     as: 'professionsEstablishmentList'
      //   });

      Department.hasMany(models.DepartmentSpeciality, {
        foreignKey: 'dept_id',
        as: 'specialitiesList'
      });
      //   Department.hasMany(models.department_images, {
      //     foreignKey: 'department_id',
      //     as: 'imageList'
      //   });
    }
  }
  Department.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      establishment_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Department',
      tableName: 'departments',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return Department;
};
