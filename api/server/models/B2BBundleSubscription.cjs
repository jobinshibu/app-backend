'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class B2BBundleSubscription extends Model {
        static associate(models) {
            B2BBundleSubscription.belongsTo(models.PackageBundle, {
                foreignKey: 'bundle_id',
                as: 'bundle'
            });
            B2BBundleSubscription.hasMany(models.B2BEmployeeCoupon, {
                foreignKey: 'subscription_id',
                as: 'customers'
            });
        }
    }

    B2BBundleSubscription.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            company_name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            bundle_id: {
                type: DataTypes.STRING(10),
                allowNull: false,
            },
            employee_count: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            total_price: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                defaultValue: 0.0,
            },
            payment_status: {
                type: DataTypes.ENUM("pending", "paid"),
                defaultValue: "pending",
            },
            coupon_code: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true
            },
        },
        {
            sequelize,
            modelName: 'B2BBundleSubscription',
            tableName: 'b2b_bundle_subscriptions',
            updatedAt: 'updated_at',
            createdAt: 'created_at',
            deletedAt: 'deleted_at',
            paranoid: true,
        }
    );
    return B2BBundleSubscription;
};
