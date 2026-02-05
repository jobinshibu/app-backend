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

      const establishments = await database.Establishment.findAll({
        attributes: ['id', 'name', 'address'],
        include: [
          { model: database.Zones, as: 'zoneInfo', attributes: ['name'] },
          { model: database.Cities, as: 'cityInfo', attributes: ['name'] },
          {
            model: database.EstablishmentSpeciality,
            as: 'specialitiesList',
            include: [{ model: database.Specialities, as: 'specialityInfo', attributes: ['name'] }]
          },
          {
            model: database.EstablishmentBrands,
            as: 'brandsList',
            include: [{ model: database.Brands, as: 'brandInfo', attributes: ['name'] }]
          },
          {
            model: database.EstablishmentType,
            as: 'establishmentTypeInfo',
            attributes: ['name'],
          },
        ],
        where: { active_status: 1, deleted_at: null },
      });

      for (const est of establishments) {
        const zoneName = est.zoneInfo?.name || "";
        const cityName = est.cityInfo?.name || "";
        const specNames = est.specialitiesList?.map(s => s.specialityInfo?.name).filter(Boolean).join(" ") || "";
        const brandNames = est.brandsList?.map(b => b.brandInfo?.name).filter(Boolean).join(" ") || "";
        const typeName = est.establishmentTypeInfo?.name || "Others";

        const keyword = `${est.name} ${zoneName} ${cityName} ${specNames} ${brandNames} ${typeName}`.toLowerCase();

        await database.Search.create({
          name: est.name,
          keyword: keyword.slice(0, 255),
          type: typeName.toLowerCase(),
          reference_id: est.id,
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
      const words = searchText.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let whereClause = {};

      if (words.length > 0) {
        whereClause[Op.and] = words.map(word => ({
          keyword: { [Op.like]: `%${word}%` }
        }));
      }

      if (type) {
        whereClause.type = type;
      }

      const response = await database.Search.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: database.Establishment,
            as: 'establishmentInfo',
            attributes: ['id', 'name', 'address', 'primary_photo'],
            required: true, // Only return if establishment exists
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

      // INCREMENT search_count
      if (response.rows.length > 0) {
        const searchIds = response.rows.map(item => item.id);
        await database.Search.increment('search_count', {
          by: 1,
          where: { id: { [Op.in]: searchIds } }
        });
      }

      // LOG SEARCH ANALYTICS
      try {
        const searchAnalyticsModel = database.search_analytics || database.SearchAnalytics;
        if (searchAnalyticsModel) {
          const analyticsEntry = await searchAnalyticsModel.findOne({
            where: { search_text: searchText.trim().toLowerCase() }
          });

          if (analyticsEntry) {
            await analyticsEntry.increment('search_count', { by: 1 });
            await analyticsEntry.update({ last_searched_at: new Date() });
          } else {
            await searchAnalyticsModel.create({
              search_text: searchText.trim().toLowerCase(),
              search_type: type || 'general',
              search_count: 1,
              last_searched_at: new Date()
            });
          }
        }
      } catch (analyticsError) {
        console.error('Error logging search analytics:', analyticsError.message);
      }

      const results = response.rows.map((item) => {
        return {
          id: item.id,
          name: item.name,
          keyword: item.keyword,
          type: capitalizeFirstLetter(item.type),
          reference_id: item.reference_id,
          search_count: item.search_count,
          entity: item.establishmentInfo
        };
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

  async getPopularSearches(type = null, limit = 8) {
    try {
      const whereClause = {
        search_count: { [Op.gt]: 0 }
      };

      if (type) {
        whereClause.type = type;
      }

      const response = await database.Search.findAll({
        where: whereClause,
        include: [
          {
            model: database.Establishment,
            as: 'establishmentInfo',
            attributes: ['id', 'name', 'address', 'primary_photo'],
            required: true, // Only return if establishment exists
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
          }
        ],
        limit,
        order: [
          ['search_count', 'DESC'],
          ['updated_at', 'DESC'],
        ],
      });

      const results = response.map((item) => {
        return {
          id: item.id,
          name: item.name,
          keyword: item.keyword,
          type: capitalizeFirstLetter(item.type),
          reference_id: item.reference_id,
          search_count: item.search_count,
          entity: {
            id: item.establishmentInfo.id,
            name: item.establishmentInfo.name,
            address: item.establishmentInfo.address,
            image: item.establishmentInfo.primary_photo,
            imageList: item.establishmentInfo.imageList,
          }
        };
      });

      return dataParse(results);
    } catch (error) {
      console.error('Error getting popular searches:', error);
      throw error;
    }
  }
}

export default new SearchService();