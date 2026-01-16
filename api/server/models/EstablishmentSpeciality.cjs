('use strict');
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EstablishmentSpeciality extends Model {
    static associate(models) {
      EstablishmentSpeciality.belongsTo(models.Specialities, {
        foreignKey: 'speciality_id',
        as: 'specialityInfo'
      });
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
