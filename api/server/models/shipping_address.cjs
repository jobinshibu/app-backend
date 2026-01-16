'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ShippingAddress extends Model {
    static associate(models) {
      ShippingAddress.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
      ShippingAddress.hasMany(models.PackageBooking, {
        foreignKey: 'customer_address_id',
        as: 'packageBookings'
      });
    }
  }

  ShippingAddress.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      name: DataTypes.STRING,
      address: DataTypes.STRING,
      city: DataTypes.STRING,
      zip_code: DataTypes.STRING,
      country: DataTypes.STRING,
      phone_number: DataTypes.STRING,
      address_type: DataTypes.STRING, // House, Apartment, Office
      is_default_address: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
      },
      landmark: { type: DataTypes.STRING, allowNull: true },
      street: { type: DataTypes.STRING, allowNull: true },
      address_label: { type: DataTypes.STRING, allowNull: true },
      Housename: { type: DataTypes.STRING, allowNull: true, field: 'Housename' },
      building_name: { type: DataTypes.STRING, allowNull: true, field: 'building_name' },
      apartment_number: { type: DataTypes.STRING, allowNull: true, field: 'apartment_number' },
      company_name: { type: DataTypes.STRING, allowNull: true, field: 'company_name' },
      floor: { type: DataTypes.STRING, allowNull: true },
      additional_directions: { type: DataTypes.STRING, allowNull: true }
    },
    {
      sequelize,
      modelName: 'ShippingAddress',
      tableName: 'shipping_addresses',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );

  return ShippingAddress;
};