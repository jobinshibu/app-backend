('use strict');
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HealthTestImage extends Model {
    static associate(models) {
      //   HealthTestImage.belongsTo(models.Establishment, {
      //     foreignKey: 'establishment_id',
      //     as: 'establishmentInfo'
      //   });
    }
  }
  HealthTestImage.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      health_test_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      image: {
        type: DataTypes.STRING(255),
        allowNull: false,
        get() {
          const rawValue = this.getDataValue('image');
          return rawValue
            ? process.env.IMAGE_PATH + `/healthTests/${rawValue}`
            : null;
        }
      }
    },
    {
      sequelize,
      modelName: 'HealthTestImage',
      tableName: 'health_test_images',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return HealthTestImage;
};
