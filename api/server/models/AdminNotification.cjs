'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AdminNotification extends Model {
    static associate(models) {
      // define association here
    }
  }

  AdminNotification.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      body: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      status: {
        type: DataTypes.ENUM('sent', 'delivered', 'pending', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
      },
    },
    {
      sequelize,
      modelName: 'AdminNotification',
      tableName: 'admin_notifications',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );

  return AdminNotification;
};