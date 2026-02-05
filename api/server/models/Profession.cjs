'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Profession extends Model {
    static associate(models) {
      Profession.belongsTo(models.ProfessionType, {
        foreignKey: 'profession_type_id',
        as: 'professionTypeInfo'
      });
      Profession.belongsTo(models.Nationalities, {
        foreignKey: 'nationality_id',
        as: 'nationalitiesInfo'
      });
      Profession.hasMany(models.ProfessionSpeciality, {
        foreignKey: 'proffession_id',
        as: 'specialitiesList'
      });
      // Add this association to your Profession model's associate method
      Profession.hasMany(models.ProfessionDepartment, {
        foreignKey: 'proffession_id',
        as: 'professionDepartmentsList'
      });
      Profession.hasMany(models.ProfessionLanguage, {
        foreignKey: 'proffession_id',
        as: 'languagesList'
      });
      Profession.hasMany(models.profession_working_hours, {
        foreignKey: "profession_id",
        as: "working_hours",
      });
    }
  }
  Profession.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      licence_no: {
        type: DataTypes.STRING(100)
        // allowNull: true,
      },
      profession_type_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      surnametype: {
        type: DataTypes.ENUM("Dr.", "Mr.", "Ms.", "Mrs."),
        allowNull: true,
        defaultValue: "Dr."
      },
      first_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      last_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      specialist: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      about: {
        type: DataTypes.STRING(1000),
        allowNull: true
      },
      designation: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      photo: {
        type: DataTypes.STRING(255),
        get() {
          const rawValue = this.getDataValue('photo');
          return rawValue
            ? process.env.IMAGE_PATH + '/professions/' + rawValue
            : null;
        }
      },
      email: {
        type: DataTypes.STRING(100)
        // allowNull: true,
        // unique: true,
      },
      mobile_country_code: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING(50)
        // allowNull: true,
        // unique: true,
      },
      educational_qualification: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      working_since_month: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      working_since_year: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      expert_in: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      nationality_id: {
        type: DataTypes.INTEGER(255),
        allowNull: true
      },
      consultation_fees: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      online_consultation: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      gender: {
        type: DataTypes.ENUM("male", "female", "other"),
        allowNull: true,
      },
      available: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },
      healineVerified: { // Added new field
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      recommended: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      topRated: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      topRatedTitle: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      active_status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
    },
    {
      sequelize,
      modelName: 'Profession',
      tableName: 'professions',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  );
  return Profession;
};