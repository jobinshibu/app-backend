'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Specialities extends Model {
    static associate(models) {
      Specialities.afterCreate(async (speciality) => {
        const keyword = speciality.name.toLowerCase();
        await models.Search.upsert({
          keyword,
          type: 'speciality',
          reference_id: speciality.id,
        });
      });

      Specialities.afterUpdate(async (speciality) => {
        const keyword = speciality.name.toLowerCase();
        await models.Search.upsert({
          keyword,
          type: 'speciality',
          reference_id: speciality.id,
        });
      });

      Specialities.afterDestroy(async (speciality) => {
        await models.Search.destroy({
          where: { reference_id: speciality.id, type: 'speciality' },
        });
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
