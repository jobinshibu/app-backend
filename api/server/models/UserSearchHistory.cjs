// models/UserSearchHistory.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserSearchHistory extends Model {
    static associate(models) {
      UserSearchHistory.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  UserSearchHistory.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    search_text: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    search_type: {
      type: DataTypes.ENUM('doctor', 'hospital', 'service', 'speciality', 'general'),
      defaultValue: 'general',
    },
    search_filters: {
      type: DataTypes.JSON,
      allowNull: true,
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
    }
  }, {
    sequelize,
    modelName: 'UserSearchHistory',
    tableName: 'user_search_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return UserSearchHistory;
};
