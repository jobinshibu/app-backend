('use strict');
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Cities extends Model {
    static associate(models) { }
  }
  Cities.init(
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
      zone_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Cities',
      tableName: 'cities',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  Cities.afterUpdate(async (city, options) => {
    if (city.changed('name')) {
      try {
        const Establishment = sequelize.models.Establishment;
        if (Establishment) {
          const linkedEstablishments = await Establishment.findAll({
            where: { city_id: city.id },
            attributes: ['id'],
            transaction: options.transaction
          });
          for (const est of linkedEstablishments) {
            await Establishment.update(
              { updated_at: new Date() },
              { where: { id: est.id }, transaction: options.transaction, individualHooks: true }
            );
          }
        }
      } catch (err) {
        console.error('Cities afterUpdate search sync trigger failed:', err.message);
      }
    }
  });

  return Cities;
};
