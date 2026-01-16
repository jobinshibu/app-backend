'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Favorite extends Model {
    static associate(models) {
      // Association with Profession for doctors
      Favorite.belongsTo(models.Profession, {
        foreignKey: 'reference_id',
        constraints: false,
        as: 'professionInfo'
      });

      // Association with Establishment for hospitals
      Favorite.belongsTo(models.Establishment, {
        foreignKey: 'reference_id',
        constraints: false,
        as: 'establishmentInfo'
      });

      // Association with Service for services
      Favorite.belongsTo(models.Service, {
        foreignKey: 'reference_id',
        constraints: false,
        as: 'serviceInfo'
      });

      // Association with Specialities for specialities
      Favorite.belongsTo(models.Specialities, {
        foreignKey: 'reference_id',
        constraints: false,
        as: 'specialityInfo'
      });
    }
  }

  Favorite.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'customer_id'
      },
      type: {
        type: DataTypes.ENUM('doctor', 'hospital', 'service', 'speciality','clinic','pharmacy'),
        allowNull: false
      },
      reference_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'Favorite',
      tableName: 'favorites',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['customer_id', 'type', 'reference_id']
        }
      ]
    }
  );

  return Favorite;
};