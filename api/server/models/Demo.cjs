('use strict');
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Demo extends Model {
    static associate(models) {}
  }
  Demo.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      android_version: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      ios_version: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      androidButtonVisible: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      },
      iosButtonVisible: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Demo',
      tableName: 'demo',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return Demo;
};
