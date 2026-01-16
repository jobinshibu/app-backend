('use strict');
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Nationalities extends Model {
    static associate(models) {}
  }
  Nationalities.init(
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
            ? process.env.IMAGE_PATH + '/nationalities/' + rawValue
            : null;
        }
      }
    },
    {
      sequelize,
      modelName: 'Nationalities',
      tableName: 'nationalities',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return Nationalities;
};
