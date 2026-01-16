'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProfessionLanguage extends Model {
    static associate(models) {
      ProfessionLanguage.belongsTo(models.Language, {
        foreignKey: 'language_id',
        as: 'languageInfo'
      });
    }
  }
  ProfessionLanguage.init(
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
      language_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'ProfessionLanguage',
      tableName: 'professions_languges',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return ProfessionLanguage;
};
