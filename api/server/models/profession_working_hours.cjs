'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  const ProfessionWorkingHours = sequelize.define(
    "profession_working_hours",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      profession_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      day_of_week: {
        type: DataTypes.INTEGER, // 0 = Sunday, 6 = Saturday
        allowNull: true,
      },
      start_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      end_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      is_day_off: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

    },
    {
      updatedAt: "updated_at",
      createdAt: "created_at",
      deletedAt: "deleted_at",
      timestamps: true,
      paranoid: true
    }
  );

  ProfessionWorkingHours.associate = function (models) {
    ProfessionWorkingHours.belongsTo(models.Profession, {
      foreignKey: "profession_id",
      as: "doctor",
    });
  };

  return ProfessionWorkingHours;
};
