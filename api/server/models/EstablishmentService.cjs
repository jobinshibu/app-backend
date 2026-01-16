'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EstablishmentService extends Model {
    static associate(models) {
      EstablishmentService.belongsTo(models.Service, {
        foreignKey: 'service_id',
        as: 'name'
      });
      EstablishmentService.belongsTo(models.Establishment, {
        foreignKey: 'establishment_id',
        as: 'establishment'
      });
    }
  }
  
  EstablishmentService.init(
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
      service_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'EstablishmentService',
      tableName: 'establishment_services',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return EstablishmentService;
};
