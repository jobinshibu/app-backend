'use strict';
const { Model } = require('sequelize');
const moment = require('moment');

module.exports = (sequelize, DataTypes) => {
  class SavedCard extends Model {
    static associate(models) {
      SavedCard.belongsTo(models.Customer, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }

  SavedCard.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      stripe_payment_method_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      card_brand: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      card_last4: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      card_exp_month: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      card_exp_year: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },

      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      }
    },
    {
      sequelize,
      modelName: "SavedCard",
      tableName: "saved_cards",
      timestamps: false,
      underscored: true,
    }
  );

  

  return SavedCard;
};
