'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      Role.hasMany(models.RolePermission, {
        foreignKey: "role_id",
        as: "permissions",
        onDelete: "CASCADE"
      });
      Role.hasMany(models.User, {
        foreignKey: "role_id",
        as: "users"
      });
    }
  }
  Role.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(500),
        allowNull: false,
      }
    },
    {
      sequelize,
      modelName: 'Role',
      tableName: 'roles',
      updatedAt: "updated_at",
      createdAt: "created_at",
      deletedAt: "deleted_at",
      paranoid: true,
    }
  );
  return Role;
};
