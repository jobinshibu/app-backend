'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    static associate(models) {
      // One Service can have many Bookings
      // Service.hasMany(models.ServiceBooking, {
      //   foreignKey: 'service_id',
      //   as: 'bookings'
      // });
      Service.hasMany(models.EstablishmentService, {
        foreignKey: 'service_id',
        as: 'servicesList',
      });
      // If categoryId is linked to Specialities table
      Service.belongsTo(models.Specialities, {
        foreignKey: 'categoryId',
        as: 'categoryInfo'
      });
      
      // Service.hasMany(models.ServiceWorkingHours, {
      //   foreignKey: 'service_id',
      //   as: 'working_hours',
      // });
      Service.afterCreate(async (service) => {
        const keyword = service.name.toLowerCase();
        await models.Search.upsert({
          name: service.name,
          keyword,
          type: 'service',
          reference_id: service.id,
        });
      });

      Service.afterUpdate(async (service) => {
        const keyword = service.name.toLowerCase();
        await models.Search.upsert({
          name: service.name,
          keyword,
          type: 'service',
          reference_id: service.id,
        });
      });

      Service.afterDestroy(async (service) => {
        await models.Search.destroy({
          where: { reference_id: service.id, type: 'service' },
        });
      });
    }
  }
  Service.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      serviceType: {
        type: DataTypes.ENUM("forWomen", "forMen", "forKid", "forSeniors", "nursingService"),
        allowNull: true
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      hospitalDetails: {
        type: DataTypes.JSON, // { id, lat, long, name, address, phone }
        allowNull: true
      },
      price: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      discountPrice: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      resultTime: {
        type: DataTypes.STRING,
        allowNull: true
      },
      homeSampleCollection: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      testOverview: {
        type: DataTypes.JSON, // [{ title, description }]
        allowNull: true
      },
      timeSchedule: {
        type: DataTypes.STRING,
        allowNull: true
      },
      // insuranceList: {
      //   type: DataTypes.JSON, // []
      //   allowNull: true
      // },
      requiredSamples: {
        type: DataTypes.JSON, // []
        allowNull: true
      },
      image: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Service',
      tableName: 'services',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return Service;
};