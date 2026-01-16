('use strict');
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HealthTestCategory extends Model {
    static associate(models) {}
  }
  HealthTestCategory.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'HealthTestCategory',
      tableName: 'health_test_categories',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return HealthTestCategory;
};
