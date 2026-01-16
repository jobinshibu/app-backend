('use strict');
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HealthTest extends Model {
    static associate(models) {
      HealthTest.hasMany(models.HealthTestImage, {
        foreignKey: 'health_test_id',
        as: 'imageList'
      });
      HealthTest.hasMany(models.HealthTestEstablishment, {
        foreignKey: 'health_test_id',
        as: 'establishmentList'
      });
      HealthTest.belongsTo(models.HealthTestCategory, {
        foreignKey: 'category_id',
        as: 'categoryInfo'
      });
    }
  }
  HealthTest.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      sample: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      result_duration: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      discounted_price: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      mobile_number: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'HealthTest',
      tableName: 'health_tests',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return HealthTest;
};
