'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PromotionNotification extends Model {
    static associate(models) {
      PromotionNotification.belongsTo(models.PromotionFailedLog, {
        foreignKey: 'promotion_notification_id',
        as: 'failedLogs'
      });
    }
  }

  PromotionNotification.init(
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
      reference_id: { 
        type: DataTypes.INTEGER, 
        allowNull: true 
      },
      title: { 
        type: DataTypes.STRING, 
        allowNull: false 
      },
      body: { 
        type: DataTypes.TEXT, 
        allowNull: false 
      },
      image: { 
        type: DataTypes.STRING, 
        allowNull: true,
        get() {
          const rawValue = this.getDataValue('image');
          return rawValue
            ? process.env.IMAGE_PATH + '/promotion-notifications/' + rawValue
            : null;
        }
      },
      schedule_at: { 
        type: DataTypes.DATE, 
        allowNull: true 
      },
      sent_at: { 
        type: DataTypes.DATE, 
        allowNull: true 
      },
      total_target: { 
        type: DataTypes.INTEGER, 
        defaultValue: 0 
      },
      total_sent: { 
        type: DataTypes.INTEGER, 
        defaultValue: 0 
      },
      total_failed: { 
        type: DataTypes.INTEGER, 
        defaultValue: 0 
      },
      success_rate: { 
        type: DataTypes.FLOAT, 
        defaultValue: 0 
      },
      status: {
        type: DataTypes.ENUM("pending", "scheduled", "processing", "completed", "failed"),
        defaultValue: "pending",
      },
    },
    {
      sequelize,
      modelName: 'PromotionNotification',
      tableName: 'promotion_notifications',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );

  return PromotionNotification;
};