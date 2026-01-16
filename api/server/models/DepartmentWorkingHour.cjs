'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DepartmentWorkingHour extends Model {
    static associate(models) {}
  }
  DepartmentWorkingHour.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      day_of_week: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      start_time: {
        type: DataTypes.TIME
      },
      end_time: {
        type: DataTypes.TIME
      },
      is_day_off: {
        type: DataTypes.ENUM('0', '1'),
        defaultValue: '0'
      }
    },
    {
      sequelize,
      modelName: 'DepartmentWorkingHour',
      tableName: 'department_working_hours',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return DepartmentWorkingHour;
};
