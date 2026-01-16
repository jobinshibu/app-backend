'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EstablishmentBrands extends Model {
    static associate(models) {
      EstablishmentBrands.belongsTo(models.Brands, {
        foreignKey: 'brand_id',
        as: 'brandInfo'
      });
    }
  }
  EstablishmentBrands.init(
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
      brand_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'EstablishmentBrands',
      tableName: 'establishment_brands',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return EstablishmentBrands;
};
