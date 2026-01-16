'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PackageCategory extends Model {
    static associate(models) {

      PackageCategory.hasMany(models.Package, {
        foreignKey: 'category_id',
        as: 'packages'
      });
    }
  }
  PackageCategory.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.STRING(1000),
        allowNull: false
      },
      icon: {
        type: DataTypes.STRING(255),
        get() {
          const rawValue = this.getDataValue('icon');
          return rawValue
            ? process.env.IMAGE_PATH + '/package_categories/' + rawValue
            : null;
        }
      }
    },
    {
      sequelize,
      modelName: 'PackageCategory',
      tableName: 'package_categories',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return PackageCategory;
};