('use strict');
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HealthTestBooking extends Model {
    static associate(models) {
      HealthTestBooking.belongsTo(models.HealthTest, {
        foreignKey: 'health_test_id',
        as: 'HealthTestBookingInfo'
      });
    }
  }
  HealthTestBooking.init(
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
      city_id: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      phone_code: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      phone_number: {
        type: DataTypes.INTEGER(15),
        allowNull: false
      },
      date_of_test: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      health_test_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'HealthTestBooking',
      tableName: 'health_test_bookings',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return HealthTestBooking;
};
