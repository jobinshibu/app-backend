'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class MyGarage extends Model {
        static associate(models) {
            MyGarage.belongsTo(models.Customer, {
                foreignKey: 'customer_id',
                as: 'customer'
            });
            MyGarage.belongsTo(models.Brands, {
                foreignKey: 'brand_id',
                as: 'brand'
            });
            MyGarage.belongsTo(models.Models, {
                foreignKey: 'model_id',
                as: 'model'
            });
        }
    }
    MyGarage.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            customer_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            brand_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            model_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            country: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            emirates: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            plate_code: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            plate_number: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            color: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            fuel_type: {
                type: DataTypes.STRING,
                allowNull: true,
            }
        },
        {
            sequelize,
            modelName: 'MyGarage',
            tableName: 'my_garage',
            updatedAt: 'updated_at',
            createdAt: 'created_at',
            deletedAt: 'deleted_at',
            timestamps: true,
            paranoid: true,
        }
    );
    return MyGarage;
};