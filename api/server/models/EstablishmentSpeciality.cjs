('use strict');
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EstablishmentSpeciality extends Model {
    static associate(models) {
      EstablishmentSpeciality.belongsTo(models.Specialities, {
        foreignKey: 'speciality_id',
        as: 'specialityInfo'
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
          console.error('EstablishmentSpeciality search sync trigger failed:', err.message);
        }
      };

      EstablishmentSpeciality.afterCreate(triggerEstablishmentSync);
      EstablishmentSpeciality.afterUpdate(triggerEstablishmentSync);
      EstablishmentSpeciality.afterDestroy(triggerEstablishmentSync);
    }
  }
  EstablishmentSpeciality.init(
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
      speciality_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'EstablishmentSpeciality',
      tableName: 'establishment_specialities',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return EstablishmentSpeciality;
};
