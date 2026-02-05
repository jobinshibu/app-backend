'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Brands extends Model {
    static associate(models) {
      Brands.hasMany(models.Models, {
        foreignKey: 'brand_id',
        as: 'models'
      });
    }
  }
  Brands.init(
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
      icon: {
        type: DataTypes.STRING(255),
        get() {
          const rawValue = this.getDataValue('icon');
          return rawValue
            ? process.env.IMAGE_PATH + '/brands/' + rawValue
            : null;
        }
      },
      description: {
        type: DataTypes.TEXT('long')
      },
    },
    {
      sequelize,
      modelName: 'Brands',
      tableName: 'brands',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  Brands.afterUpdate(async (brand, options) => {
    if (brand.changed('name')) {
      try {
        const EstablishmentBrands = sequelize.models.EstablishmentBrands;
        const Establishment = sequelize.models.Establishment;
        if (EstablishmentBrands && Establishment) {
          const links = await EstablishmentBrands.findAll({
            where: { brand_id: brand.id },
            attributes: ['establishment_id'],
            transaction: options.transaction
          });
          for (const link of links) {
            await Establishment.update(
              { updated_at: new Date() },
              { where: { id: link.establishment_id }, transaction: options.transaction, individualHooks: true }
            );
          }
        }
      } catch (err) {
        console.error('Brands afterUpdate search sync trigger failed:', err.message);
      }
    }
  });

  return Brands;
};
