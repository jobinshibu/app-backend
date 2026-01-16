'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PharmacyProduct extends Model {
    static associate(models) {
      PharmacyProduct.belongsTo(models.PharmacyCategory, {
        foreignKey: 'category_id',
        as: 'category'
      });

      PharmacyProduct.belongsTo(models.PharmacyBrand, {
        foreignKey: 'brand_id',
        as: 'brand'
      });

      PharmacyProduct.hasMany(models.PharmacyInventory, {
        foreignKey: 'product_id',
        as: 'inventory'
      });
      PharmacyProduct.hasMany(models.PharmacyCartItem, {
        foreignKey: 'product_id',
        as: 'cartItems',
      });

      PharmacyProduct.hasMany(models.PharmacyOrderItem, {
        foreignKey: 'product_id',
        as: 'orderItems',
      });

      PharmacyProduct.hasMany(models.PillpackMedicine, {
        foreignKey: 'product_id',
        as: 'pillpackMedicines'
      });

    }

    // Auto full image URL
    get image_url() {
      const img = this.getDataValue('image');
      return img ? `${process.env.IMAGE_PATH}/pharmacy-products/${img}` : null;
    }
  }

  PharmacyProduct.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true, autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      brand_id: {
        type: DataTypes.INTEGER
      },
      category_id: {
        type: DataTypes.INTEGER
      },
      description: {
        type: DataTypes.TEXT
      },
      image: {
        type: DataTypes.STRING(255)
      },
      base_price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
      },
      selling_price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
      },
      is_prescription_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      stock_global: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    },
    {
      sequelize,
      modelName: 'PharmacyProduct',
      tableName: 'pharmacy_products',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at'
    }
  );

  return PharmacyProduct;
};