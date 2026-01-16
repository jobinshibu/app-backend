'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PackageBundleItem extends Model {
    static associate(models) {

      // 🔗 BELONGS TO BUNDLE
      PackageBundleItem.belongsTo(models.PackageBundle, {
        foreignKey: 'bundle_id',
        as: 'bundle'
      });

      // 🔗 BELONGS TO PACKAGE
      PackageBundleItem.belongsTo(models.Package, {
        foreignKey: 'package_id',
        as: 'package'
      });
    }
  }

  PackageBundleItem.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      bundle_id: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      package_id: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      qty: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: 'PackageBundleItem',
      tableName: 'package_bundle_items',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return PackageBundleItem;
};
