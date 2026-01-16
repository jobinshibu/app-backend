import database from '../models/index.js';
import { dataParse } from '../utils/utils.js';
import { Op } from 'sequelize';

class FavoriteService {
  async addToFavorites(customer_id, type, reference_id) {
    try {
      // Check if favorite already exists
      const existingFavorite = await database.Favorite.findOne({
        where: {
          customer_id,
          type,
          reference_id
        }
      });

      if (existingFavorite) {
        throw new Error('Item is already in favorites');
      }

      // Verify that the reference exists
      await this.verifyReference(type, reference_id);

      const favorite = await database.Favorite.create({
        customer_id,
        type,
        reference_id
      });

      return dataParse(favorite);
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  async removeFromFavorites(customer_id, type, reference_id) {
    try {
      const deletedCount = await database.Favorite.destroy({
        where: {
          customer_id,
          type,
          reference_id
        }
      });

      if (deletedCount === 0) {
        throw new Error('Favorite not found');
      }

      return { message: 'Favorite removed successfully' };
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  async getFavoritesWithDetails(customer_id, type = null, reference_id = null) {
    try {
      const whereClause = { customer_id };

      if (type) {
        whereClause.type = type;
      }
      if (reference_id) {
        whereClause.reference_id = reference_id;
      }
      const favorites = await database.Favorite.findAll({
        where: whereClause,
        include: [
          {
            model: database.Profession,
            as: 'professionInfo',
            attributes: [
              'id',
              'first_name',
              'last_name',
              'specialist',
              'designation',
              'photo',
              'consultation_fees',
              'gender',
              'healineVerified',
              'recommended',
              'topRated',
              'educational_qualification',
              'working_since_month',
              'working_since_year',
              'expert_in'
            ],
            required: false,
            include: [
              {
                model: database.ProfessionType,
                as: 'professionTypeInfo',
                attributes: ['id', 'name']
              },
              {
                model: database.Nationalities,
                as: 'nationalitiesInfo',
                attributes: ['id', 'name']
              },
              {
                model: database.ProfessionSpeciality,
                as: 'specialitiesList',
                attributes: ['speciality_id'],
                include: [{
                  model: database.Specialities,
                  as: 'specialityInfo',
                  attributes: ['id', 'name', 'icon']
                }]
              },
              {
                model: database.ProfessionDepartment,
                as: 'professionDepartmentsList',
                attributes: ['establishment_id'],
                include: [{
                  model: database.Establishment,
                  as: 'establishmentInfo',
                  attributes: ['id', 'name', 'address', 'latitude', 'longitude']
                }]
              }
            ]
          },
          {
            model: database.Establishment,
            as: 'establishmentInfo',
            attributes: [
              'id',
              'name',
              'address',
              'latitude',
              'longitude',
              'primary_photo',
              'healineVerified',
              'recommended',
              'topRated',
              'contact_number',
              'email'
            ],
            required: false,
            include: [
              {
                model: database.EstablishmentType,
                as: 'establishmentTypeInfo',
                attributes: ['id', 'name']
              },
              {
                model: database.Cities,
                as: 'cityInfo',
                attributes: ['id', 'name']
              },
              {
                model: database.Zones,
                as: 'zoneInfo',
                attributes: ['id', 'name']
              },
              {
                model: database.EstablishmentSpeciality,
                as: 'specialitiesList',
                attributes: ['speciality_id'],
                include: [{
                  model: database.Specialities,
                  as: 'specialityInfo',
                  attributes: ['id', 'name', 'icon']
                }]
              },
              // {
              //   model: database.InsuranceEstablishment,
              //   as: 'insuranceList',
              //   attributes: ['insurance_id'],
              //   include: [{
              //     model: database.Insurance,
              //     as: 'insuranceInfo',
              //     attributes: ['id', 'name']
              //   }]
              // }
            ]
          },
          {
            model: database.Service,
            as: 'serviceInfo',
            attributes: [
              'id',
              'name',
              'description',
              'price',
              'discountPrice',
              'resultTime',
              'homeSampleCollection',
              'image',
              'serviceType'
            ],
            required: false,
            include: [
              {
                model: database.Specialities,
                as: 'categoryInfo',
                attributes: ['id', 'name', 'icon']
              }
            ]
          },
          {
            model: database.Specialities,
            as: 'specialityInfo',
            attributes: [
              'id',
              'name',
              'icon',
              'description',
              'tier'
            ],
            required: false
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // Transform the data to include entity details based on type
      const transformedFavorites = favorites.map(favorite => {
        const favoriteData = {
          id: favorite.id,
          customer_id: favorite.customer_id,
          type: favorite.type,
          reference_id: favorite.reference_id,
          created_at: favorite.created_at,
          updated_at: favorite.updated_at,
          rating: 4.5, // Default rating
          distance: '10 km' // Default distance
        };

        switch (favorite.type) {
          case 'doctor':
            if (favorite.professionInfo) {
              favoriteData.entity = {
                ...favorite.professionInfo.toJSON(),
                full_name: `${favorite.professionInfo.first_name} ${favorite.professionInfo.last_name}`,
                specialties: favorite.professionInfo.specialitiesList?.map(spec => spec.specialityInfo) || [],
                practice_locations: favorite.professionInfo.professionDepartmentsList?.map(pd => pd.establishmentInfo) || []
              };
            }
            break;

          case 'hospital':
            if (favorite.establishmentInfo) {
              favoriteData.entity = {
                ...favorite.establishmentInfo.toJSON(),
                specialties: favorite.establishmentInfo.specialitiesList?.map(spec => spec.specialityInfo) || [],
                // accepted_insurances: favorite.establishmentInfo.insuranceList?.map(ins => ins.insuranceInfo) || []
              };
            }
            break;

          case 'service':
            if (favorite.serviceInfo) {
              const baseUrl = `${process.env.IMAGE_PATH || 'http://localhost:5710'}/services/`;
              favoriteData.entity = {
                ...favorite.serviceInfo.toJSON(),
                image: favorite.serviceInfo.image ? baseUrl + favorite.serviceInfo.image : null
              };
            }
            break;

          case 'speciality':
            if (favorite.specialityInfo) {
              favoriteData.entity = favorite.specialityInfo.toJSON();
            }
            break;

          case 'clinic':
            if (favorite.establishmentInfo) {
              favoriteData.entity = {
                ...favorite.establishmentInfo.toJSON(),
                specialties: favorite.establishmentInfo.specialitiesList?.map(spec => spec.specialityInfo) || [],
                // accepted_insurances: favorite.establishmentInfo.insuranceList?.map(ins => ins.insuranceInfo) || []
              };
            }
            break;

          case 'pharmacy':
            if (favorite.establishmentInfo) {
              favoriteData.entity = {
                ...favorite.establishmentInfo.toJSON(),
                specialties: favorite.establishmentInfo.specialitiesList?.map(spec => spec.specialityInfo) || [],
                // accepted_insurances: favorite.establishmentInfo.insuranceList?.map(ins => ins.insuranceInfo) || []
              };
            }
            break;
        }

        return favoriteData;
      });

      return dataParse(transformedFavorites);
    } catch (error) {
      console.error('Error getting favorites with details:', error);
      throw error;
    }
  }

  async verifyReference(type, reference_id) {
    let model;
    switch (type) {
      case 'doctor':
        model = database.Profession;
        break;
      case 'hospital':
        model = database.Establishment;
        break;
      case 'service':
        model = database.Service;
        break;
      case 'speciality':
        model = database.Specialities;
        break;
      case 'clinic':
        model = database.Establishment;
        break;
      case 'pharmacy':
        model = database.Establishment;
        break;
      default:
        throw new Error('Invalid favorite type');
    }

    const exists = await model.findByPk(reference_id);
    if (!exists) {
      throw new Error(`${type} with ID ${reference_id} not found`);
    }

    return true;
  }
  async checkFavoriteStatus(customer_id, type, reference_id) {
    try {
      // Validate type
      const validTypes = ['doctor', 'hospital', 'service', 'speciality', 'clinic', 'pharmacy'];
      if (!validTypes.includes(type)) {
        throw new Error('Invalid type. Must be one of: doctor, hospital, service, speciality, clinic, pharmacy');
      }

      const favorite = await database.Favorite.findOne({
        where: {
          customer_id,
          type,
          reference_id
        }
      });

      return !!favorite; // Returns true if favorite exists, false otherwise
    } catch (error) {
      console.error('Error checking favorite status:', error);
      throw error;
    }
  }
}

export default new FavoriteService();