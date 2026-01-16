'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Bookmark extends Model {
    static associate(models) {
      Bookmark.belongsTo(models.Establishment, {
        foreignKey: 'establishment_id',
        as: 'establishmentInfo'
      });
    }
  }
  Bookmark.init(
    {
      user_id: DataTypes.INTEGER,
      establishment_id: DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: 'Bookmark',
      tableName: 'bookmarks',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return Bookmark;
};
