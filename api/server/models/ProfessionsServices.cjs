'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProfessionService extends Model {
    static associate(models) {
      ProfessionService.belongsTo(models.Service, {
        foreignKey: "service_id",
        as: "serviceInfo"
      });
    }
  }
  ProfessionService.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      proffession_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      service_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "ProfessionService",
      tableName: "professions_services",
      updatedAt: "updated_at",
      createdAt: "created_at",
      deletedAt: "deleted_at",
      paranoid: true
    }
  );
  return ProfessionService;
};
