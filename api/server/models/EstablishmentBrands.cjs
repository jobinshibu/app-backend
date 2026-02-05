'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EstablishmentBrands extends Model {
    static associate(models) {
      EstablishmentBrands.belongsTo(models.Brands, {
        foreignKey: 'brand_id',
        as: 'brandInfo'
      });

      // === SEARCH SYNC HOOKS ===
      const triggerEstablishmentSync = async (instance, options) => {
        try {
          const Establishment = models.Establishment;
          if (Establishment && instance.establishment_id) {
            await Establishment.update(
              { updated_at: new Date() },
              { where: { id: instance.establishment_id }, transaction: options.transaction, individualHooks: true }
            );
          }
        } catch (err) {
          console.error('EstablishmentBrands search sync trigger failed:', err.message);
        }
      };

      EstablishmentBrands.afterCreate(triggerEstablishmentSync);
      EstablishmentBrands.afterUpdate(triggerEstablishmentSync);
      EstablishmentBrands.afterDestroy(triggerEstablishmentSync);
    }
  }
  EstablishmentBrands.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      establishment_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      brand_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'EstablishmentBrands',
      tableName: 'establishment_brands',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return EstablishmentBrands;
};
