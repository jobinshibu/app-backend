'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PackageAddon extends Model {
    static associate(models) {

      PackageAddon.belongsTo(models.Package, {
        foreignKey: 'package_id',
        as: 'package',
      });

      PackageAddon.belongsTo(models.Biomarker, {
        foreignKey: 'biomarker_id',
        as: 'biomarkerInfo'
      });

      PackageAddon.belongsTo(models.Package, {
        foreignKey: 'addon_package_id',
        as: 'addonPackageInfo'
      });

      PackageAddon.belongsTo(models.BiomarkerGroup, {
        foreignKey: 'group_id',
        as: 'groupInfo'
      });
    }
  }

  PackageAddon.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      package_id: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      biomarker_id: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      group_id: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      addon_package_id: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      recommended: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      why_recommended: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'PackageAddon',
      tableName: 'package_addons',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return PackageAddon;
};