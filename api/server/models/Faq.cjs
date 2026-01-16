'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Faq extends Model {
    static associate(models) {
      // No associations defined, following the Booking model structure
    }
  }

  Faq.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      question: {
        type: DataTypes.STRING(1000),
        allowNull: false,
      },
      answer: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(1000),  
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Faq',
      tableName: 'faqs',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true, // Enable soft deletes
    }
  );

  return Faq;
};