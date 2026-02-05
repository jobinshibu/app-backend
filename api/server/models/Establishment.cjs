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


      // === CENTRALIZED SEARCH SYNC HELPER ===
      const syncWithSearch = async (establishmentId, transaction = null) => {
        try {
          const searchModel = models.Search || models.search;
          if (!searchModel) return;

          const establishment = await models.Establishment.findByPk(establishmentId, {
            attributes: ["id", "name", "active_status"],
            include: [
              { model: models.Zones, as: 'zoneInfo', attributes: ['name'] },
              { model: models.Cities, as: 'cityInfo', attributes: ['name'] },
              {
                model: models.EstablishmentSpeciality,
                as: 'specialitiesList',
                include: [{ model: models.Specialities, as: 'specialityInfo', attributes: ['name'] }]
              },
              {
                model: models.EstablishmentBrands,
                as: 'brandsList',
                include: [{ model: models.Brands, as: 'brandInfo', attributes: ['name'] }]
              },
              {
                model: models.EstablishmentType,
                as: 'establishmentTypeInfo',
                attributes: ['name']
              }
            ],
            transaction
          });

          if (!establishment) return;

          // STEP 1: Always delete old entries
          await searchModel.destroy({
            where: { reference_id: establishmentId, type: { [Op.ne]: 'doctor' } },
            transaction
          });

          // If inactive, don't recreate
          if (!establishment.active_status) return;

          // STEP 2: Construct keywords
          const zoneName = establishment.zoneInfo?.name || "";
          const cityName = establishment.cityInfo?.name || "";
          const specNames = establishment.specialitiesList?.map(s => s.specialityInfo?.name).filter(Boolean).join(" ") || "";
          const brandNames = establishment.brandsList?.map(b => b.brandInfo?.name).filter(Boolean).join(" ") || "";
          const typeName = establishment.establishmentTypeInfo?.name || "Others";

          const keyword = `${establishment.name} ${zoneName} ${cityName} ${specNames} ${brandNames} ${typeName}`.toLowerCase().trim();

          // STEP 3: Create search entry
          await searchModel.create({
            name: establishment.name.trim(),
            keyword: keyword.slice(0, 255),
            type: typeName.toLowerCase(),
            reference_id: establishmentId,
            search_count: 0
          }, { transaction });

        } catch (error) {
          console.error(`Model-level search sync failed for establishment ${establishmentId}:`, error);
        }
      };

      // === HOOKS ===
      Establishment.afterCreate(async (establishment, options) => {
        await syncWithSearch(establishment.id, options.transaction);
      });

      Establishment.afterUpdate(async (establishment, options) => {
        await syncWithSearch(establishment.id, options.transaction);
      });

      Establishment.afterDestroy(async (establishment, options) => {
        try {
          const searchModel = models.Search || models.search;
          if (searchModel) {
            await searchModel.destroy({
              where: { reference_id: establishment.id },
              transaction: options.transaction
            });
          }
        } catch (error) {
          console.error('Establishment afterDestroy search cleanup failed:', error);
        }
      });

      Establishment.afterBulkUpdate(async (options) => {
        try {
          const { where } = options;
          if (!where || !where.id) return;

          let ids = Array.isArray(where.id) ? where.id : [where.id];
          for (const id of ids) {
            await syncWithSearch(id, options.transaction);
          }
        } catch (error) {
          console.error('Establishment afterBulkUpdate search sync failed:', error);
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