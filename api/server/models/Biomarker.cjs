'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Biomarker extends Model {
    static associate(models) {
      // Belongs to Biomarker Groups (many-to-many)
      Biomarker.belongsToMany(models.BiomarkerGroup, {
        through: 'GroupBiomarker',
        foreignKey: 'biomarker_id',
        otherKey: 'group_id',
        as: 'groups'
      });

      // Belongs to Packages (many-to-many)
      Biomarker.belongsToMany(models.Package, {
        through: 'PackageBiomarker',
        foreignKey: 'biomarker_id',
        otherKey: 'package_id',
        as: 'packages'
      });

      //REVERSE FOR ADDONS
      Biomarker.belongsToMany(models.Package, {
        through: 'PackageAddon',
        foreignKey: 'biomarker_id',
        otherKey: 'package_id',
        as: 'addonPackages'
      });
    }
  }

  Biomarker.init(
    {
      id: {
        type: DataTypes.STRING(10),
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING(255),
        get() {
          const rawValue = this.getDataValue('image');
          return rawValue
            ? process.env.IMAGE_PATH + '/biomarker/' + rawValue
            : null;
        }
      },
      significance: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('Qualitative', 'Quantitative'),
        allowNull: false,
      },
      specimen: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      unit: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      fasting_required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      fasting_time_hours: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      critical_min: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      critical_max: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      normal_min: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      normal_max: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      base_price: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      selling_price: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'Biomarker',
      tableName: 'biomarkers',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return Biomarker;
};