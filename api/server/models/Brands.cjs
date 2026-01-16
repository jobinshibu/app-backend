'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Brands extends Model {
    static associate(models) {}
  }
  Brands.init(
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
            ? process.env.IMAGE_PATH + '/brands/' + rawValue
            : null;
        }
      },
      description: {
        type: DataTypes.TEXT('long')
      },
    },
    {
      sequelize,
      modelName: 'Brands',
      tableName: 'brands',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return Brands;
};
