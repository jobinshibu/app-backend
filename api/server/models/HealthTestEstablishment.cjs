('use strict');
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HealthTestEstablishment extends Model {
    static associate(models) {
      HealthTestEstablishment.belongsTo(models.Establishment, {
        foreignKey: 'establishment_id',
        as: 'establishmentInfo'
      });
    }
  }
  HealthTestEstablishment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      health_test_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      establishment_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'HealthTestEstablishment',
      tableName: 'health_test_establishments',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return HealthTestEstablishment;
};
