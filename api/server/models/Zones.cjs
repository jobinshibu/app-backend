('use strict');
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Zones extends Model {
    static associate(models) {}
  }
  Zones.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Zones',
      tableName: 'zones',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return Zones;
};
