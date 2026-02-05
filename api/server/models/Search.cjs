'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Search extends Model {
    static associate(models) {
      Search.belongsTo(models.Profession, {
        foreignKey: 'reference_id',
        constraints: false,
        as: 'professionInfo',
      });
      Search.belongsTo(models.Establishment, {
        foreignKey: 'reference_id',
        constraints: false,
        as: 'establishmentInfo',
      });
      Search.belongsTo(models.Service, {
        foreignKey: 'reference_id',
        constraints: false,
        as: 'serviceInfo',
      });
      Search.belongsTo(models.Specialities, {
        foreignKey: 'reference_id',
        constraints: false,
        as: 'specialityInfo',
      });
      Search.belongsTo(models.Package, {
        foreignKey: 'reference_id',
        constraints: false,
        as: 'packageInfo',
      });
      Search.belongsTo(models.PackageCategory, {
        foreignKey: 'reference_id',
        constraints: false,
        as: 'packageCategoryInfo',
      });
    }
  }

  Search.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      keyword: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('doctor', 'hospital', 'clinic', 'pharmacy', 'laboratory', 'others')
      },
      reference_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      search_count: {  // ADD THIS NEW FIELD
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Search',
      tableName: 'search',
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return Search;
};