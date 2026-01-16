import database from '../models/index.js';
import { dataParse } from '../utils/utils.js';
import { Op, literal, where } from 'sequelize';

const capitalizeFirstLetter = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

class SearchService {
  async syncSearchData() {
    try {
      await database.Search.destroy({ where: {}, truncate: true });

      const ALLOWED_TYPES = ['hospital', 'clinic', 'pharmacy'];

      const professions = await database.Profession.findAll({
        attributes: ['id', 'first_name', 'last_name', 'specialist', 'photo'],
        where: { active_status: 1, deleted_at: null },
      });

      for (const profession of professions) {
        const name = `${profession.first_name} ${profession.last_name}`.trim();
        const keyword = `${name} ${profession.specialist}`.toLowerCase();
        await database.Search.create({
          name,
          keyword,
          type: 'doctor',
          reference_id: profession.id,
          search_count: 0
        });
      }
      // Sync establishments with their specific types
      const establishments = await database.Establishment.findAll({
        attributes: ['id', 'name', 'address'],
        include: [
          {
            model: database.EstablishmentType,
            as: 'establishmentTypeInfo',
            attributes: ['name'],
            required: true,
            where: {
              name: { [Op.in]: ALLOWED_TYPES }
            }
          },
        ],
        where: { active_status: 1, deleted_at: null },
      });
      for (const establishment of establishments) {
        const name = establishment.name;
        const keyword = `${establishment.name} ${establishment.address}`.toLowerCase();
        const establishmentType = establishment.establishmentTypeInfo.name.toLowerCase(); // Use EstablishmentType name
        await database.Search.create({
          name,
          keyword,
          type: establishmentType, // Use dynamic type (e.g., 'hospital', 'clinic', 'pharmacy')
          reference_id: establishment.id,
          search_count: 0
        });
      }

      const specialities = await database.Specialities.findAll({
        attributes: ['id', 'name'],
      });
      for (const speciality of specialities) {
        const name = speciality.name;
        const keyword = speciality.name.toLowerCase();
        await database.Search.create({
          name,
          keyword,
          type: 'speciality',
          reference_id: speciality.id,
          search_count: 0
        });
      }

      const packages = await database.Package.findAll({
        attributes: ['id', 'name'],
      });
      for (const pack of packages) {
        const name = pack.name;
        const keyword = pack.name.toLowerCase();
        await database.Search.create({
          name,
          keyword,
          type: 'package',
          reference_id: pack.id,
          search_count: 0
        });
      }

      const packageCategories = await database.PackageCategory.findAll({
        attributes: ['id', 'name'],
      });
      for (const category of packageCategories) {
        const name = category.name;
        const keyword = category.name.toLowerCase();
        await database.Search.create({
          name,
          keyword,
          type: 'package category',
          reference_id: category.id,
          search_count: 0
        });
      }

      return { message: 'Search data synchronized successfully' };
    } catch (error) {
      console.error('Error syncing search data:', error);
      throw error;
    }
  }

  async searchEntities(searchText, type = null, limit = 10, offset = 0) {
    try {
      const whereClause = {
        keyword: { [Op.like]: `%${searchText.toLowerCase()}%` },
      };
      if (type) {
        whereClause.type = type;
      }

      const response = await database.Search.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: database.Profession,
            as: 'professionInfo',
            attributes: ['id', 'first_name', 'last_name', 'specialist', 'photo'],
            required: false,
            where: { deleted_at: null },
          },
          {
            model: database.Establishment,
            as: 'establishmentInfo',
            attributes: ['id', 'name', 'address', 'primary_photo'],
            required: false,
            where: { deleted_at: null },
            include: [
              {
                model: database.EstablishmentImages,
                as: 'imageList',
                attributes: ['id', 'image'],
                required: false,
                where: { deleted_at: null },
              },
            ],
          },
          {
            model: database.Service,
            as: 'serviceInfo',
            attributes: ['id', 'name', 'price', 'discountPrice', 'image'],
            required: false,
            where: { deleted_at: null },
          },
          {
            model: database.Specialities,
            as: 'specialityInfo',
            attributes: ['id', 'name', 'icon'],
            required: false,
            where: { deleted_at: null },
          },
          {
            model: database.Package,
            as: 'packageInfo',
            attributes: ['id', 'name', 'description', 'image'],
            required: false,
          },
          {
            model: database.PackageCategory,
            as: 'packageCategoryInfo',
            attributes: ['id', 'name', 'icon'],
            required: false,
          }
        ],
        limit,
        offset,
        order: [
          [
            literal(`
              CASE
                WHEN LOWER(keyword) LIKE LOWER(CONCAT(:searchText, '%')) THEN 1
                WHEN LOWER(keyword) LIKE LOWER(CONCAT('%', :searchText, '%')) AND 
                     LOWER(keyword) NOT LIKE LOWER(CONCAT(:searchText, '%')) AND 
                     LOWER(keyword) NOT LIKE LOWER(CONCAT('%', :searchText)) THEN 2
                WHEN LOWER(keyword) LIKE LOWER(CONCAT('%', :searchText)) THEN 3
                ELSE 4
              END
            `),
            'ASC',
          ],
          ['created_at', 'DESC'],
        ],
        replacements: { searchText: searchText.toLowerCase() },
        logging: console.log,
      });

      // INCREMENT search_count for matched results
      if (response.rows.length > 0) {
        const searchIds = response.rows.map(item => item.id);
        await database.Search.increment('search_count', {
          by: 1,
          where: {
            id: {
              [Op.in]: searchIds
            }
          }
        });
      }

      const results = response.rows.map((item) => {
        const data = {
          id: item.id,
          name: item.name,
          keyword: item.keyword,
          type: capitalizeFirstLetter(item.type),
          reference_id: item.reference_id,
          search_count: item.search_count, // Include search count in response
        };
        if (item.type === 'doctor' && item.professionInfo) {
          data.entity = item.professionInfo;
        } else if (item.type === 'hospital' && item.establishmentInfo) {
          data.entity = item.establishmentInfo;
        } else if (item.type === 'clinic' && item.establishmentInfo) {
          data.entity = item.establishmentInfo;
        } else if (item.type === 'service' && item.serviceInfo) {
          data.entity = item.serviceInfo;
        } else if (item.type === 'speciality' && item.specialityInfo) {
          data.entity = item.specialityInfo;
        }
        else if (item.type === 'package' && item.packageInfo) {
          data.entity = item.packageInfo;
        }
        else if (item.type === 'package category' && item.packageCategoryInfo) {
          data.entity = item.packageCategoryInfo;
        }
        return data;
      });

      return {
        rows: dataParse(results),
        count: response.count,
      };
    } catch (error) {
      console.error('Error searching entities:', error);
      throw error;
    }
  }

  // ADD new method for popular searches
  async getPopularSearches(type = null, limit = 8) {
    try {
      const whereClause = {
        search_count: { [Op.gt]: 0 } // Only include items that have been searched
      };

      if (type) {
        whereClause.type = type;
      }

      const response = await database.Search.findAll({
        where: whereClause,
        include: [
          {
            model: database.Profession,
            as: 'professionInfo',
            attributes: ['id', 'first_name', 'last_name', 'specialist', 'photo'],
            required: false,
            where: { deleted_at: null },
          },
          {
            model: database.Establishment,
            as: 'establishmentInfo',
            attributes: ['id', 'name', 'address', 'primary_photo'],
            required: false,
            where: { deleted_at: null },
            include: [
              {
                model: database.EstablishmentImages,
                as: 'imageList',
                attributes: ['id', 'image'],
                required: false,
                where: { deleted_at: null },
              },
            ],
          },
          {
            model: database.Service,
            as: 'serviceInfo',
            attributes: ['id', 'name', 'price', 'discountPrice', 'image'],
            required: false,
            where: { deleted_at: null },
          },
          {
            model: database.Specialities,
            as: 'specialityInfo',
            attributes: ['id', 'name', 'icon'],
            required: false,
            where: { deleted_at: null },
          },
          {
            model: database.Package,
            as: 'packageInfo',
            attributes: ['id', 'name', 'description', 'image'],
            required: false,
          },
          {
            model: database.PackageCategory,
            as: 'packageCategoryInfo',
            attributes: ['id', 'name', 'icon'],
            required: false,
          }
        ],
        limit,
        order: [
          ['search_count', 'DESC'], // Order by most searched first
          ['updated_at', 'DESC'],   // Then by recently updated
        ],
      });

      const results = response.map((item) => {
        const data = {
          id: item.id,
          name: item.name,
          keyword: item.keyword,
          type: capitalizeFirstLetter(item.type),
          reference_id: item.reference_id,
          search_count: item.search_count,
        };

        if (item.type === 'doctor' && item.professionInfo) {
          data.entity = {
            id: item.professionInfo.id,
            name: `${item.professionInfo.first_name} ${item.professionInfo.last_name}`,
            specialist: item.professionInfo.specialist,
            image: item.professionInfo.photo, // Rename 'photo' to 'image'
          };
        } else if (['doctor', 'hospital', 'clinic', 'pharmacy', 'laboratory', 'service', 'speciality', 'day surgery Centre', 'others'].includes(item.type) && item.establishmentInfo) {
          data.entity = {
            id: item.establishmentInfo.id,
            name: item.establishmentInfo.name,
            address: item.establishmentInfo.address,
            image: item.establishmentInfo.primary_photo, // Rename 'primary_photo' to 'image'
            imageList: item.establishmentInfo.imageList, // Keep imageList as is
          };
        } else if (item.type === 'service' && item.serviceInfo) {
          data.entity = {
            id: item.serviceInfo.id,
            name: item.serviceInfo.name,
            price: item.serviceInfo.price,
            discountPrice: item.serviceInfo.discountPrice,
            image: item.serviceInfo.image, // Already named 'image'
          };
        } else if (item.type === 'speciality' && item.specialityInfo) {
          data.entity = {
            id: item.specialityInfo.id,
            name: item.specialityInfo.name,
            image: item.specialityInfo.icon, // Rename 'icon' to 'image'
          };
        } else if (item.type === 'package' && item.packageInfo) {
          data.entity = {
            id: Number(item.packageInfo.id),
            name: item.packageInfo.name,
            description: item.packageInfo.description,
            image: item.packageInfo.image,
          };
        } else if (item.type === 'package category' && item.packageCategoryInfo) {
          data.entity = {
            id: Number(item.packageCategoryInfo.id),
            name: item.packageCategoryInfo.name,
            image: item.packageCategoryInfo.icon, // Rename 'icon' to 'image'
          };
        }

        return data;
      });

      return dataParse(results);
    } catch (error) {
      console.error('Error getting popular searches:', error);
      throw error;
    }
  }
}

export default new SearchService();