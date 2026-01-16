'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EstablishmentBannerImages extends Model {
    static associate(models) {
      EstablishmentBannerImages.belongsTo(models.Establishment, {
        foreignKey: 'establishment_id',
        as: 'establishmentInfo'
      });
    }
  }
  EstablishmentBannerImages.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      establishment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'establishments',
          key: 'id'
        }
      },
      image: {
        type: DataTypes.STRING(255),
        allowNull: false,
        get() {
          const rawValue = this.getDataValue('image');
          return rawValue
            ? process.env.IMAGE_PATH + '/establishment/banners/' + rawValue
            : null;
        }
      },
      linkUrl: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'banner'
      }
    },
    {
      sequelize,
      modelName: 'EstablishmentBannerImages',
      tableName: 'establishment_banner_images',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return EstablishmentBannerImages;
};