'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GroupBiomarker extends Model {
    static associate(models) {
      // Junction table - no additional associations
    }
  }

  GroupBiomarker.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      group_id: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      biomarker_id: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'GroupBiomarker',
      tableName: 'group_biomarkers',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return GroupBiomarker;
};