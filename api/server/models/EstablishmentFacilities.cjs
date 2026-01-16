'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EstablishmentFacilities extends Model {
    static associate(models) {
      EstablishmentFacilities.belongsTo(models.Facilities, {
        foreignKey: 'facility_id',
        as: 'facilityInfo'
      });
    }
  }
  EstablishmentFacilities.init(
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
      facility_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'EstablishmentFacilities',
      tableName: 'establishment_facilities',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return EstablishmentFacilities;
};
