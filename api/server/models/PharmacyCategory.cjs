'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PharmacyCategory extends Model {
    static associate(models) {
      PharmacyCategory.hasMany(models.PharmacyProduct, { 
        foreignKey: 'category_id', 
        as: 'products' 
      });
    }
  }
  PharmacyCategory.init(
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
      icon: { 
        type: DataTypes.STRING(255) 
      },
      is_quick_link: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
      },
      sort_order: { 
        type: DataTypes.INTEGER, 
        defaultValue: 0 
      }
    }, 
    { 
      sequelize, 
      modelName: 'PharmacyCategory', 
      tableName: 'pharmacy_categories',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at' 
    }
  );
  
  return PharmacyCategory;
};