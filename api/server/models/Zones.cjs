('use strict');
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Zones extends Model {
    static associate(models) { }
  }
  Zones.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Zones',
      tableName: 'zones',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  Zones.afterUpdate(async (zone, options) => {
    if (zone.changed('name')) {
      try {
        const Establishment = sequelize.models.Establishment;
        if (Establishment) {
          const linkedEstablishments = await Establishment.findAll({
            where: { zone_id: zone.id },
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
        console.error('Zones afterUpdate search sync trigger failed:', err.message);
      }
    }
  });

  return Zones;
};
