'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProfessionSpeciality extends Model {
    static associate(models) {
      ProfessionSpeciality.belongsTo(models.Specialities, {
        foreignKey: 'speciality_id',
        as: 'specialityInfo'
      });
    }
  }
  ProfessionSpeciality.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      proffession_id: {
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
      modelName: 'ProfessionSpeciality',
      tableName: 'professions_specialities',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return ProfessionSpeciality;
};
