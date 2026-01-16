'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class B2BEmployeeCoupon extends Model {
        static associate(models) {
            B2BEmployeeCoupon.belongsTo(models.B2BBundleSubscription, {
                foreignKey: 'subscription_id',
                as: 'subscription'
            });
            B2BEmployeeCoupon.belongsTo(models.Customer, {
                foreignKey: 'claimed_by_customer_id',
                as: 'claimer'
            });
        }
    }

    B2BEmployeeCoupon.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            subscription_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            employee_phone: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            country_code: {
                type: DataTypes.STRING(10),
                allowNull: true,
            },
            employee_name: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            designation: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM("available", "claimed", "expired"),
                defaultValue: "available",
            },
            claimed_by_customer_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            claimed_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'B2BEmployeeCoupon',
            tableName: 'b2b_employee_coupons',
            updatedAt: 'updated_at',
            createdAt: 'created_at',
        }
    );
    return B2BEmployeeCoupon;
};
