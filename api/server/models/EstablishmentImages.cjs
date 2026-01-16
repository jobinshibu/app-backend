'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EstablishmentImages extends Model {
    static associate(models) {}
  }
  EstablishmentImages.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      establishment_id: {
        type: DataTypes.INTEGER
      },
      image: {
        type: DataTypes.STRING(255),
        allowNull: false,
        get() {
          const rawValue = this.getDataValue('image');
          return rawValue
            ? process.env.IMAGE_PATH + '/establishment/' + rawValue
            : null;
        }
      },
      image_type: {
        type: DataTypes.ENUM('gallery', 'main'),
        allowNull: false,
        defaultValue: 'gallery'
      }
    },
    {
      sequelize,
      modelName: 'EstablishmentImages',
      tableName: 'establishment_images',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return EstablishmentImages;
};