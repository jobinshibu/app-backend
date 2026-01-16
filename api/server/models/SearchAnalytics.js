
// models/SearchAnalytics.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SearchAnalytics extends Model {
    static associate(models) {
      // Define associations if needed
    }
  }

  SearchAnalytics.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    search_text: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    search_type: {
      type: DataTypes.ENUM('doctor', 'hospital', 'service', 'speciality', 'general'),
      defaultValue: 'general',
    },
    search_count: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    last_searched_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
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
    modelName: 'SearchAnalytics',
    tableName: 'search_analytics',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return SearchAnalytics;
};