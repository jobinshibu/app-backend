'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PharmacyBrand extends Model {
    static associate(models) {
      PharmacyBrand.hasMany(models.PharmacyProduct, { 
        foreignKey: 'brand_id', 
        as: 'products' 
      });
    }
  }
  PharmacyBrand.init(
    {
      id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
      },
      name: { 
        type: DataTypes.STRING(100), 
        allowNull: false 
      },
      logo: { 
        type: DataTypes.STRING(255) 
      }
    }, 
    { 
      sequelize, 
      modelName: 'PharmacyBrand', 
      tableName: 'pharmacy_brands',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at' 
    }
  );
  
  return PharmacyBrand;
};
