'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Establishment extends Model {
    static associate(models) {
      Establishment.belongsTo(models.EstablishmentType, {
        foreignKey: 'establishment_type',
        as: 'establishmentTypeInfo'
      });
      Establishment.hasMany(models.EstablishmentBannerImages, {
        foreignKey: 'establishment_id',
        as: 'bannerImageList'
      });
      Establishment.hasMany(models.EstablishmentWorkingHour, {
        foreignKey: 'establishment_id',
        as: 'workingHoursDetails'
      });
      Establishment.hasMany(models.Department, {
        foreignKey: 'establishment_id',
        as: 'departmentList'
      });
      Establishment.hasOne(models.EstablishmentWorkingHour, {
        foreignKey: 'establishment_id',
        as: 'todayWorkingHoursDetails'
      });
      Establishment.hasMany(models.EstablishmentFacilities, {
        foreignKey: 'establishment_id',
        as: 'facilitiesList'
      });
      Establishment.hasMany(models.EstablishmentBrands, {
        foreignKey: 'establishment_id',
        as: 'brandsList'
      });
      Establishment.hasMany(models.EstablishmentImages, {
        foreignKey: 'establishment_id',
        as: 'imageList'
      });
      Establishment.hasMany(models.ProfessionDepartment, {
        foreignKey: 'establishment_id',
        as: 'professionsList'
      });
      Establishment.hasMany(models.EstablishmentSpeciality, {
        foreignKey: 'establishment_id',
        as: 'specialitiesList'
      });
      Establishment.belongsTo(models.Zones, {
        foreignKey: 'zone_id',
        as: 'zoneInfo'
      });
      Establishment.belongsTo(models.Cities, {
        foreignKey: 'city_id',
        as: 'cityInfo'
      });
      Establishment.hasMany(models.InsurancePlanEstablishment, {
        foreignKey: 'establishment_id',
        as: 'insurancePlans'
      });
      Establishment.hasMany(models.EstablishmentService, {
        foreignKey: 'establishment_id',
        as: 'servicesList'
      });
      Establishment.hasMany(models.Package, {
        foreignKey: 'establishment_id',
        as: 'packagesList'
      });
      // In Establishment.associate
      Establishment.hasMany(models.PharmacyInventory, {
        foreignKey: 'pharmacy_id',
        as: 'inventory'
      });

      Establishment.belongsToMany(models.PharmacyProduct, {
        through: models.PharmacyInventory,
        foreignKey: 'pharmacy_id',
        otherKey: 'product_id',
        as: 'products'        // ← THIS IS THE ONE YOUR CONTROLLER USES
      });
      Establishment.hasMany(models.PharmacyCartItem, {
        foreignKey: 'pharmacy_id',
        as: 'cartItems',
      });

      Establishment.hasMany(models.PharmacyOrderItem, {
        foreignKey: 'pharmacy_id',
        as: 'orderItems',
      });

      Establishment.hasMany(models.PillpackMedicine, {
        foreignKey: 'pharmacy_id',
        as: 'pillpackMedicines'
      });


      // Hooks for syncing to Search table
      Establishment.afterCreate(async (establishment) => {
        try {
          const models = establishment.sequelize.models; // Access all models via sequelize

          // Get establishment type name dynamically
          const establishmentType = await models.EstablishmentType.findByPk(establishment.establishment_type);
          const type = establishmentType ? establishmentType.name : 'Others';

          const keyword = `${establishment.name} ${establishment.address}`.toLowerCase();
          await models.Search.upsert({
            name: establishment.name,
            keyword,
            type: type,
            reference_id: establishment.id,
            search_count: 0
          });
        } catch (error) {
          console.error('Error in Establishment afterCreate hook:', error);
        }
      });

      Establishment.afterUpdate(async (establishment) => {
        try {
          const models = establishment.sequelize.models;

          // Get establishment type name dynamically
          const establishmentType = await models.EstablishmentType.findByPk(establishment.establishment_type);
          const type = establishmentType ? establishmentType.name : 'Others';

          const keyword = `${establishment.name} ${establishment.address}`.toLowerCase();
          await models.Search.upsert({
            name: establishment.name,
            keyword,
            type: type,
            reference_id: establishment.id,
            search_count: establishment.search_count || 0 // Preserve existing count if needed
          }, {
            where: { reference_id: establishment.id, type: type }
          });
        } catch (error) {
          console.error('Error in Establishment afterUpdate hook:', error);
        }
      });

      Establishment.afterDestroy(async (establishment) => {
        try {
          const models = establishment.sequelize.models;

          // Get establishment type name dynamically for deletion
          const establishmentType = await models.EstablishmentType.findByPk(establishment.establishment_type);
          const type = establishmentType ? establishmentType.name : 'Others';

          await models.Search.destroy({
            where: { reference_id: establishment.id, type: type }
          });
        } catch (error) {
          console.error('Error in Establishment afterDestroy hook:', error);
        }
      });
    }
  }
  Establishment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      licence_no: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: {
          args: true,
          msg: 'Email address already in use!'
        }
      },
      establishment_type: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      city_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      zone_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      pin_code: {
        type: DataTypes.STRING(255)
      },
      latitude: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      longitude: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
      },
      establishment_sub_type: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      mobile_country_code: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      contact_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: {
          args: true,
          msg: 'Email address already in use!'
        }
      },
      primary_photo: {
        type: DataTypes.STRING(255),
        get() {
          const rawValue = this.getDataValue('primary_photo');
          return rawValue
            ? process.env.IMAGE_PATH + '/establishment/' + rawValue
            : null;
        }
      },
      is_24_by_7_working: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      healineVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      recommended: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      topRated: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      about: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      topRatedTitle: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      active_status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      expertin: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
    },
    {
      sequelize,
      modelName: 'Establishment',
      tableName: 'establishments',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return Establishment;
};