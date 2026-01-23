'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Models extends Model {
        static associate(models) {
            Models.belongsTo(models.Brands, {
                foreignKey: 'brand_id',
                as: 'brand'
            });
        }
    }
    Models.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            brand_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            transmission_type: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            variant: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
        },
        {
            sequelize,
            modelName: 'Models',
            tableName: 'models',
            updatedAt: 'updated_at',
            createdAt: 'created_at',
            deletedAt: 'deleted_at',
            paranoid: true
        }
    );
    return Models;
};