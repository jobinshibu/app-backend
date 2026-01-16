'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EstablishmentSubType extends Model {
    static associate(models) {
      EstablishmentSubType.belongsTo(models.EstablishmentType, {
        foreignKey: "parent_id",
        as: "establishmentTypeInfo", // Adjusted to avoid alias conflict
      });
      EstablishmentSubType.hasMany(models.Establishment, {
        foreignKey: "establishment_sub_type",
        as: "establishments",
      });
    }
  }
  EstablishmentSubType.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      parent_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'EstablishmentSubType',
      tableName: 'establishment_sub_types',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return EstablishmentSubType;
};
