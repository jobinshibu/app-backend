'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Package extends Model {
    static associate(models) {
      // Many-to-many with Biomarkers
      Package.belongsToMany(models.Biomarker, {
        through: 'PackageBiomarker',
        foreignKey: 'package_id',
        otherKey: 'biomarker_id',
        as: 'biomarkers'
      });

      // Many-to-many with Biomarker Groups
      Package.belongsToMany(models.BiomarkerGroup, {
        through: 'PackageGroup',
        foreignKey: 'package_id',
        otherKey: 'group_id',
        as: 'groups'
      });

      // ADDON BIOMARKERS (THIS WAS MISSING OR WRONG)
      Package.belongsToMany(models.Biomarker, {
        through: models.PackageAddon,
        foreignKey: "package_id",
        otherKey: "biomarker_id",
        as: "addonBiomarkers"  // THIS CREATES setAddonBiomarkers()
      });
      // ✅ ADD THIS ASSOCIATION ONLY (NO OTHER CHANGES)
      Package.belongsToMany(models.PackageBundle, {
        through: models.PackageBundleItem,
        foreignKey: 'package_id',
        otherKey: 'bundle_id',
        as: 'bundles'
      });

      // Many-to-many with Add-on Packages
      Package.belongsToMany(models.Package, {
        as: 'addons',
        through: models.PackageAddon,
        foreignKey: 'package_id',
        otherKey: 'addon_package_id'
      });

      Package.belongsToMany(models.BiomarkerGroup, {
        through: models.PackageAddon,
        foreignKey: "package_id",
        otherKey: "group_id",
        as: "addonGroups"
      });

      Package.hasMany(models.PackageAddon, {
        foreignKey: "package_id",
        as: "addonDetails",
      });

      // Belongs to Establishment
      Package.belongsTo(models.Establishment, {
        foreignKey: 'establishment_id',
        as: 'establishment'
      });

      // Belongs to PackageCategory
      Package.belongsTo(models.PackageCategory, {
        foreignKey: 'category_id',
        as: 'category'
      });

      Package.hasMany(models.PackageBooking, {
        foreignKey: 'package_id',
        as: 'bookings'
      });
    }
  }

  Package.init(
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
      sub_title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      tag: {
        type: DataTypes.TEXT,
        allowNull: true,
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
            ? process.env.IMAGE_PATH + '/packages/' + rawValue
            : null;
        }
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
      strike_price: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      discount_text: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      addon_price: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      service_duration_minutes: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      sla: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sla_unit: {
        type: DataTypes.ENUM('Hours', 'Days'),
        allowNull: true,
      },
      demographics: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      visible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      establishment_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'package_categories',
          key: 'id'
        }
      },
      type: {
        type: DataTypes.ENUM('Home test', 'Home vaccination', 'IV Therapy', 'Home nurse'),
        allowNull: true,
      },
      instructionBeforeTest: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      result_time: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      recommended: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      top_packages: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      biomarkers_tested_count: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Package',
      tableName: 'packages',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      // validate: {
      //   oneNotNull() {
      //     if (!this.biomarker_id && !this.addon_package_id) {
      //       throw new Error('Either biomarker_id or addon_package_id must be provided');
      //     }
      //   }
      // }
    }
  );

  return Package;
};