'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PharmacyInventory extends Model {
    static associate(models) {
        PharmacyInventory.belongsTo(models.PharmacyProduct, { 
            foreignKey: 'product_id', 
            as: 'product' 
        });
        PharmacyInventory.belongsTo(models.Establishment, {
            foreignKey: 'pharmacy_id',
            as: 'pharmacy'
        });

        // PharmacyInventory.belongsToMany(models.Establishment, {
        //     through: models.PharmacyProduct,
        //     foreignKey: 'product_id',
        //     otherKey: 'pharmacy_id',
        //     as: 'products'
        // });
    
    }
  }
  PharmacyInventory.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      pharmacy_id: { 
        type: DataTypes.INTEGER, 
      },
      product_id: { 
        type: DataTypes.INTEGER, 
      },
      stock: { 
        type: DataTypes.INTEGER, 
        defaultValue: 0 
      },
      price: { 
        type: DataTypes.DECIMAL(10,2) 
      }
    }, 
    {
      sequelize,
      modelName: 'PharmacyInventory',
      tableName: 'pharmacy_inventories',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: false,
      deletedAt: 'deleted_at' 
    }
  );
  return PharmacyInventory;
};