'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EstablishmentWorkingHour extends Model {
    static associate(models) {}
  }
  EstablishmentWorkingHour.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      establishment_id: {
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
      modelName: 'EstablishmentWorkingHour',
      tableName: 'establishment_working_hours',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return EstablishmentWorkingHour;
};
