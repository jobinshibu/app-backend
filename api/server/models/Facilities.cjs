'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Facilities extends Model {
    static associate(models) {}
  }
  Facilities.init(
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
            ? process.env.IMAGE_PATH + '/facilities/' + rawValue
            : null;
        }
      },
      description: {
        type: DataTypes.TEXT('long')
      },
    },
    {
      sequelize,
      modelName: 'Facilities',
      tableName: 'facilities',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return Facilities;
};
