'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Specialities extends Model {
    static associate(models) {
      Specialities.afterUpdate(async (speciality, options) => {
        if (speciality.changed('name')) {
          try {
            const EstablishmentSpeciality = sequelize.models.EstablishmentSpeciality;
            const Establishment = sequelize.models.Establishment;
            if (EstablishmentSpeciality && Establishment) {
              const links = await EstablishmentSpeciality.findAll({
                where: { speciality_id: speciality.id },
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
            console.error('Specialities afterUpdate search sync trigger failed:', err.message);
          }
        }
      });

      Specialities.hasMany(models.EstablishmentSpeciality, {
        foreignKey: 'speciality_id',
        as: 'establishmentSpecialities'
      });

      Specialities.hasMany(models.ProfessionSpeciality, {
        foreignKey: 'speciality_id',
        as: 'professionSpecialities'
      });
    }
  }
  Specialities.init(
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
            ? process.env.IMAGE_PATH + '/specialities/' + rawValue
            : null;
        }
      },

      description: {
        type: DataTypes.TEXT('long')
      },
      tier: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      }
    },
    {
      sequelize,
      modelName: 'Specialities',
      tableName: 'specialities',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return Specialities;
};
