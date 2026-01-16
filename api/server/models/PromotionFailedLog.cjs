'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PromotionFailedLog extends Model {
    static associate(models) {
      PromotionFailedLog.belongsTo(models.PromotionNotification, {
        foreignKey: 'promotion_id',
        as: 'promotion'
      });
      PromotionFailedLog.belongsTo(models.Customer, {
        foreignKey: 'user_id',
        as: 'customer'
      });
    }
  }

  PromotionFailedLog.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      promotion_id: { 
        type: DataTypes.INTEGER, 
      },
      user_id: { 
        type: DataTypes.INTEGER, 
      },
      device_token: { 
        type: DataTypes.STRING, 
      },
      error_message: { 
        type: DataTypes.STRING, 
      }
    },
    {
      sequelize,
      modelName: 'PromotionFailedLog',
      tableName: 'promotion_failed_logs',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );

  return PromotionFailedLog;
};