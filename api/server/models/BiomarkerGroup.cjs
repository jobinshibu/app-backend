'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BiomarkerGroup extends Model {
    static associate(models) {
      // Has many Biomarkers (many-to-many)
      BiomarkerGroup.belongsToMany(models.Biomarker, {
        through: 'GroupBiomarker',
        foreignKey: 'group_id',
        otherKey: 'biomarker_id',
        as: 'biomarkers'
      });

      // Belongs to Packages (many-to-many)
      BiomarkerGroup.belongsToMany(models.Package, {
        through: 'PackageGroup',
        foreignKey: 'group_id',
        otherKey: 'package_id',
        as: 'packages'
      });
    }
  }

  BiomarkerGroup.init(
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
            ? process.env.IMAGE_PATH + '/biomarker-groups/' + rawValue
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
    },
    {
      sequelize,
      modelName: 'BiomarkerGroup',
      tableName: 'biomarker_groups',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return BiomarkerGroup;
};