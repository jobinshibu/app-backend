'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PackageBundle extends Model {
    static associate(models) {

      // 🔗 MANY PACKAGES INSIDE ONE BUNDLE
      PackageBundle.belongsToMany(models.Package, {
        through: models.PackageBundleItem,
        foreignKey: 'bundle_id',
        otherKey: 'package_id',
        as: 'packages'
      });
      PackageBundle.hasMany(models.B2BBundleSubscription, {
        foreignKey: 'bundle_id',
        as: 'b2b_subscriptions'
      });


      // Optional: establishment
      PackageBundle.belongsTo(models.Establishment, {
        foreignKey: 'establishment_id',
        as: 'establishment'
      });

      // Optional: category
      PackageBundle.belongsTo(models.PackageCategory, {
        foreignKey: 'category_id',
        as: 'category'
      });
    }
  }

  PackageBundle.init(
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
      sub_title: DataTypes.STRING(255),
      description: DataTypes.TEXT,

      image: {
        type: DataTypes.STRING(255),
        get() {
          const raw = this.getDataValue('image');
          return raw ? process.env.IMAGE_PATH + '/package_bundles/' + raw : null;
        }
      },

      base_price: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
      },
      strike_price: DataTypes.DOUBLE,
      selling_price: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },

      validity_days: DataTypes.INTEGER,
      label: DataTypes.STRING(100),

      individual_restriction: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      visible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      establishment_id: DataTypes.INTEGER,
      category_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'PackageBundle',
      tableName: 'package_bundles',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return PackageBundle;
};
