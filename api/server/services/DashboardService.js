import { fn, literal, Op } from 'sequelize';
import database from '../models/index.js';
import { dataParse } from '../utils/utils.js';
import moment from 'moment/moment.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 1800, checkperiod: 120 });

class DashboardService {
  async getCategoriesList() {
    try {
      const response = await database.Specialities.findAll({
        attributes: [
          'id',
          'name',
          'icon',
          [
            database.Sequelize.literal(`(
              SELECT COUNT(DISTINCT ps.proffession_id)
              FROM professions_specialities ps
              WHERE ps.speciality_id = Specialities.id
            )`),
            'doctorsCount'
          ]
        ],
        having: {
          doctorsCount: {
            [Op.gt]: 0
          }
        },
        order: [['name', 'ASC']], // Prevent ID/name swapping
        logging: console.log // Log generated SQL
      });
      console.log('Raw response:', JSON.stringify(response, null, 2));
      return dataParse(response);
    } catch (error) {
      console.error('Error in getCategoriesList:', error.message, error.stack);
      return [];
    }
  }

  async getFaqList(type) {
    try {
      const filter = {};
      if (type) {
        filter.type = type;  // Filter by 'type' (insurance or global)
      }

      const response = await database.Faq.findAll({
        attributes: ['id', 'question', 'answer', 'type'],
        where: filter,  // Apply the filter if there's a 'type' parameter

      });
      return dataParse(response);
    } catch (error) {
      console.log('error', error);
    }
  }

  async getDemoList() {
    try {
      const response = await database.Demo.findAll({
        attributes: ['android_version', 'ios_version', 'androidButtonVisible', 'iosButtonVisible'],
      });
      return dataParse(response);
    } catch (error) {
      console.log('error', error);
    }
  }

  async getServicesList() {
    try {
      const response = await database.Service.findAll({
        attributes: ['id', 'name']
      });
      return dataParse(response);
    } catch (error) {
      console.log('error', error);
    }
  }
  async getFacilitiesList() {
    try {
      const response = await database.Facilities.findAll({
        attributes: ['id', 'name']
      });
      return dataParse(response);
    } catch (error) {
      console.log('error', error);
    }
  }
  async getEstablishmentTypesList() {
    try {
      const response = await database.EstablishmentType.findAll({
        attributes: ['id', 'name']
      });
      return dataParse(response);
    } catch (error) {
      console.log('error', error);
    }
  }
  async getBannersList() {
    try {
      const response = await database.Banner.findAll({
        attributes: ['id', 'link_url', 'image']
      });
      return dataParse(response);
    } catch (error) {
      console.log('error', error);
    }
  }
  async getHospitalsList() {
    try {
      const response = await database.Establishment.findAll({
        attributes: {
          include: [
            [
              database.Sequelize.literal(`(
                SELECT COUNT(DISTINCT proffession_id)
                FROM professions_departments
                WHERE professions_departments.establishment_id = Establishment.id
              )`),
              'doctorCount'
            ]
          ]
        },
        include: [
          {
            model: database.Zones,
            as: 'zoneInfo',
            attributes: ['id', 'name']
          },
          {
            model: database.Cities,
            as: 'cityInfo',
            attributes: ['id', 'name', 'zone_id']
          },
          {
            model: database.EstablishmentType,
            as: 'establishmentTypeInfo',
            required: true,
            attributes: ['id', 'name'],
            where: {
              name: { [Op.in]: ['Hospital', 'Clinic'] }
            }
          },
          {
            model: database.EstablishmentSpeciality,
            as: 'specialitiesList',
            attributes: ['id', 'establishment_id', 'speciality_id'],
            include: {
              model: database.Specialities,
              as: 'specialityInfo',
              attributes: ['id', 'icon', 'name']
            }
          }
        ]
      });
      return dataParse(response);
    } catch (error) {
      console.log('error', error);
    }
  }

  async getPharmacyList() {
    try {
      var dayOfWeek = moment().day();
      const response = await database.Establishment.findAll({
        include: [
          {
            model: database.Zones,
            as: 'zoneInfo',
            attributes: ['id', 'name']
          },
          {
            model: database.Cities,
            as: 'cityInfo',
            attributes: ['id', 'name', 'zone_id']
          },
          {
            model: database.EstablishmentType,
            as: 'establishmentTypeInfo',
            required: true,
            attributes: ['id', 'name'],
            where: {
              name: { [Op.in]: ['Pharmacy'] }
            }
          },
          {
            model: database.EstablishmentWorkingHour,
            as: 'todayWorkingHoursDetails',
            attributes: ['id', 'start_time', 'end_time', 'is_day_off'],
            required: false,
            where: {
              day_of_week: dayOfWeek
            }
          }
        ]
      });
      return dataParse(response);
    } catch (error) {
      console.log('error', error);
    }
  }
  // async getEstablishmentSearchList(
  //   specility_id,
  //   establishment_type,
  //   insurance_id = 0,
  //   service_id
  // ) {
  //   try {
  //     var insuranceWhereClause = {};
  //     if (insurance_id && insurance_id > 0) {
  //       insuranceWhereClause.insurance_id = insurance_id;
  //     }

  //     var specialityWhereClause = {};
  //     if (specility_id) {
  //       specialityWhereClause.speciality_id = { [Op.in]: [specility_id] };
  //     }

  //     var servicesWhereClause = {};
  //     if (service_id) {
  //       servicesWhereClause.service_id = { [Op.in]: [service_id] };
  //     }

  //     var estTypeWhereClause = {};
  //     if (establishment_type && establishment_type != '') {
  //       estTypeWhereClause.name = { [Op.in]: [establishment_type] };
  //     }

  //     const response = await database.Establishment.findAll({
  //       include: [
  //         {
  //           model: database.Zones,
  //           as: 'zoneInfo',
  //           attributes: ['id', 'name']
  //         },
  //         {
  //           model: database.Cities,
  //           as: 'cityInfo',
  //           attributes: ['id', 'name', 'zone_id']
  //         },
  //         {
  //           model: database.EstablishmentType,
  //           as: 'establishmentTypeInfo',
  //           required: Object.keys(estTypeWhereClause).length > 0 ? true : false,
  //           attributes: ['id', 'name'],
  //           where: estTypeWhereClause
  //         },
  //         {
  //           model: database.EstablishmentSpeciality,
  //           as: 'specialitiesList',
  //           required:
  //             Object.keys(specialityWhereClause).length > 0 ? true : false,
  //           attributes: ['id', 'establishment_id', 'speciality_id'],
  //           where: specialityWhereClause,
  //           include: {
  //             model: database.Specialities,
  //             as: 'specialityInfo',
  //             attributes: ['id', 'name']
  //           }
  //         },
  //         {
  //           model: database.InsuranceEstablishment,
  //           as: 'insuranceList',
  //           attributes: ['id', 'insurance_id', 'establishment_id'],
  //           required:
  //             Object.keys(insuranceWhereClause).length > 0 ? true : false,
  //           where: insuranceWhereClause,
  //           include: {
  //             model: database.Insurance,
  //             as: 'insuranceInfo',
  //             attributes: ['id', 'name']
  //           }
  //         },
  //         {
  //           model: database.EstablishmentFacilities,
  //           as: 'facilitiesList',
  //           attributes: ['id', 'establishment_id', 'facility_id'],
  //           include: {
  //             model: database.Facilities,
  //             as: 'facilityInfo',
  //             attributes: ['id', 'name']
  //           }
  //         },
  //         {
  //           model: database.EstablishmentService,
  //           as: 'servicesList',
  //           required:
  //             Object.keys(servicesWhereClause).length > 0 ? true : false,
  //           where: servicesWhereClause,
  //           attributes: ['id', 'establishment_id', 'service_id'],
  //           include: {
  //             model: database.Service,
  //             as: 'name',
  //             attributes: ['id', 'name']
  //           }
  //         },
  //         {
  //           model: database.EstablishmentWorkingHour,
  //           as: 'workingHoursDetails',
  //           attributes: ['id', 'start_time', 'end_time', 'is_day_off']
  //         }
  //       ]
  //     });

  //     return dataParse(response);
  //   } catch (error) {
  //     console.log('error', error);
  //   }
  // }

  async getEstablishmentSearchListNew(
    specility_id,
    establishment_type,
    // insurance_id = 0,
    service_id,
    userLat,
    userLng,
    offset,
    itemPerPage,
    // insurance_plan_id,
    acceptsInsurance = false,
    healineVerified = false,
    recommended = false,
    topRated = false,
    isOpenNow = false,
    searchText = '',
    image_type = null,
    establishment_id = null
  ) {
    try {
      const { Op, fn, literal } = database.Sequelize;

      // ========================================
      // OPTIMIZATION 1: Early return for single establishment
      // ========================================
      if (establishment_id) {
        return await this.getSingleEstablishment(establishment_id, image_type, userLat, userLng);
      }

      // ========================================
      // LIST QUERY - Optimized for multiple establishments
      // ========================================

      // Build where clauses
      // const insuranceWhereClause = {};
      // if (insurance_id && insurance_id > 0) {
      //   insuranceWhereClause.insurance_id = insurance_id;
      // }
      // if (insurance_plan_id && insurance_plan_id > 0) {
      //   insuranceWhereClause.plan_id = insurance_plan_id;
      // }

      const specialityWhereClause = {};
      if (specility_id) {
        specialityWhereClause.speciality_id = { [Op.in]: [specility_id] };
      }

      const servicesWhereClause = {};
      if (service_id) {
        servicesWhereClause.service_id = { [Op.in]: [service_id] };
      }

      const estTypeWhereClause = {};
      if (establishment_type && establishment_type !== '') {
        if (Array.isArray(establishment_type)) {
          const isNumericArray = establishment_type.every(type => !isNaN(parseInt(type)));
          estTypeWhereClause[isNumericArray ? 'id' : 'name'] = {
            [Op.in]: isNumericArray ? establishment_type.map(id => parseInt(id)) : establishment_type
          };
        } else {
          estTypeWhereClause[!isNaN(parseInt(establishment_type)) ? 'id' : 'name'] =
            !isNaN(parseInt(establishment_type)) ? parseInt(establishment_type) : establishment_type;
        }
      }

      const imageWhereClause = {};
      if (image_type && (image_type === 'main' || image_type === 'gallery')) {
        imageWhereClause.image_type = image_type;
      }

      const bannerImageWhereClause = {};
      if (image_type && image_type === 'banner') {
        bannerImageWhereClause.type = image_type;
      }

      const baseWhereClause = {};

      if (healineVerified === true) {
        baseWhereClause.healineVerified = true;
      }
      if (recommended === true) {
        baseWhereClause.recommended = true;
      }
      if (topRated === true) {
        baseWhereClause.topRated = true;
      }

      if (searchText && searchText.trim() !== '') {
        const trimmedSearch = searchText.trim();
        const establishmentsWithMatchingSpecialty = await database.EstablishmentSpeciality.findAll({
          include: [{
            model: database.Specialities,
            as: 'specialityInfo',
            where: { name: { [Op.like]: `%${trimmedSearch}%` } },
            attributes: ['id']
          }],
          attributes: ['establishment_id']
        });

        const specialtyMatchingIds = establishmentsWithMatchingSpecialty.map(item => item.establishment_id);
        const searchConditions = [
          { name: { [Op.like]: `%${trimmedSearch}%` } },
          { address: { [Op.like]: `%${trimmedSearch}%` } },
          ...(specialtyMatchingIds.length > 0 ? [{ id: { [Op.in]: specialtyMatchingIds } }] : [])
        ];

        baseWhereClause[Op.or] = searchConditions;
      }

      // Distance calculation
      let hasLocation = false;
      if (userLat && userLng && !isNaN(userLat) && !isNaN(userLng)) {
        const lat = parseFloat(userLat);
        const lng = parseFloat(userLng);
        hasLocation = true;
        console.log(`Searching with coordinates: ${lat}, ${lng}`);

        const hasOtherFilters =
          specility_id ||
          // insurance_id > 0 ||
          service_id ||
          // insurance_plan_id ||
          acceptsInsurance ||
          healineVerified ||
          recommended ||
          topRated ||
          isOpenNow ||
          (searchText && searchText.trim() !== '') ||
          image_type;

        if (!hasOtherFilters) {
          baseWhereClause[Op.and] = baseWhereClause[Op.and] || [];
          baseWhereClause[Op.and].push({
            latitude: { [Op.not]: null },
            longitude: { [Op.not]: null },
            [Op.and]: literal(`(
            6371 * acos(
              GREATEST(-1, LEAST(1,
                cos(radians(${lat})) * cos(radians(CAST(\`Establishment\`.\`latitude\` AS DECIMAL(10,8)))) *
                cos(radians(CAST(\`Establishment\`.\`longitude\` AS DECIMAL(11,8))) - radians(${lng})) +
                sin(radians(${lat})) * sin(radians(CAST(\`Establishment\`.\`latitude\` AS DECIMAL(10,8))))
              ))
            )
          ) <= 5`)
          });
        }
      }

      const today = moment().day();
      const nowTimeStr = moment().format('HH:mm:ss');

      const workingHoursInclude = {
        model: database.EstablishmentWorkingHour,
        as: 'workingHoursDetails',
        required: isOpenNow,
        attributes: ['day_of_week', 'start_time', 'end_time', 'is_day_off'],
        where: isOpenNow
          ? { day_of_week: today, is_day_off: false, start_time: { [Op.lte]: nowTimeStr }, end_time: { [Op.gt]: nowTimeStr } }
          : { day_of_week: today },
        separate: true // OPTIMIZATION: Separate query
      };

      // const insuranceInclude = {
      //   model: database.InsuranceEstablishment,
      //   as: 'insuranceList',
      //   attributes: ['id', 'insurance_id', 'establishment_id'],
      //   required: !!Object.keys(insuranceWhereClause).length || acceptsInsurance,
      //   where: insuranceWhereClause,
      //   separate: true, // OPTIMIZATION: Separate query
      //   limit: 20,
      //   include: {
      //     model: database.Insurance,
      //     as: 'insuranceInfo',
      //     attributes: ['id', 'name', 'logo', 'third_party_administrator', 'description', 'banner', 'is_top_insurance']
      //   }
      // };

      const attributes = [
        'id',
        'name',
        'address',
        'about',
        'latitude',
        'longitude',
        'mobile_country_code',
        'contact_number',
        'email',
        'licence_no',
        'establishment_sub_type',
        'is_24_by_7_working',
        'primary_photo',
        'healineVerified',
        'recommended',
        'expertin',
        'topRated',
        [literal('4.5'), 'rating'],
        ...(hasLocation
          ? [[fn('ROUND', literal(`(
          6371 * acos(
            GREATEST(-1, LEAST(1,
              cos(radians(${parseFloat(userLat)})) * cos(radians(CAST(\`Establishment\`.\`latitude\` AS DECIMAL(10,8)))) *
              cos(radians(CAST(\`Establishment\`.\`longitude\` AS DECIMAL(11,8))) - radians(${parseFloat(userLng)})) +
              sin(radians(${parseFloat(userLat)})) * sin(radians(CAST(\`Establishment\`.\`latitude\` AS DECIMAL(10,8))))
            ))
          )
        )`), 2), 'distance']]
          : [])
      ];

      // OPTIMIZATION: Get count without heavy includes
      const count = await database.Establishment.count({
        where: baseWhereClause,
        include: [
          {
            model: database.EstablishmentType,
            as: 'establishmentTypeInfo',
            required: !!Object.keys(estTypeWhereClause).length,
            where: estTypeWhereClause
          },
          {
            model: database.EstablishmentSpeciality,
            as: 'specialitiesList',
            required: !!Object.keys(specialityWhereClause).length,
            where: specialityWhereClause
          },
          // {
          //   model: database.InsuranceEstablishment,
          //   as: 'insuranceList',
          //   required: !!Object.keys(insuranceWhereClause).length || acceptsInsurance,
          //   where: insuranceWhereClause
          // },
          {
            model: database.EstablishmentService,
            as: 'servicesList',
            required: !!Object.keys(servicesWhereClause).length,
            where: servicesWhereClause
          },
          isOpenNow ? {
            model: database.EstablishmentWorkingHour,
            as: 'workingHoursDetails',
            required: true,
            where: {
              day_of_week: today,
              is_day_off: false,
              start_time: { [Op.lte]: nowTimeStr },
              end_time: { [Op.gt]: nowTimeStr }
            }
          } : null
        ].filter(Boolean),
        distinct: true
      });

      console.log(`Final count with all filters: ${count}`);

      // OPTIMIZATION: Fetch data with separate queries for associations
      const response = await database.Establishment.findAll({
        where: baseWhereClause,
        attributes,
        include: [
          { model: database.Zones, as: 'zoneInfo', attributes: ['id', 'name'], required: false },
          { model: database.Cities, as: 'cityInfo', attributes: ['id', 'name', 'zone_id'], required: false },
          {
            model: database.EstablishmentType,
            as: 'establishmentTypeInfo',
            required: !!Object.keys(estTypeWhereClause).length,
            attributes: ['id', 'name'],
            where: estTypeWhereClause
          },
          {
            model: database.EstablishmentSpeciality,
            as: 'specialitiesList',
            required: !!Object.keys(specialityWhereClause).length,
            attributes: ['id', 'establishment_id', 'speciality_id'],
            where: specialityWhereClause,
            separate: true, // OPTIMIZATION
            limit: 20,
            include: { model: database.Specialities, as: 'specialityInfo', attributes: ['id', 'name', 'icon'] }
          },
          // insuranceInclude,
          {
            model: database.EstablishmentService,
            as: 'servicesList',
            required: !!Object.keys(servicesWhereClause).length,
            where: servicesWhereClause,
            attributes: ['id', 'establishment_id', 'service_id'],
            separate: true, // OPTIMIZATION
            limit: 20,
            include: { model: database.Service, as: 'name', attributes: ['id', 'name'] }
          },
          workingHoursInclude,
          {
            model: database.ProfessionDepartment,
            as: 'professionsList',
            attributes: ['proffession_id', 'establishment_id'],
            required: false,
            separate: true, // OPTIMIZATION
            limit: 10, // Show only 10 doctors in list view
            include: [{
              model: database.Profession,
              as: 'professionInfo',
              attributes: [
                'id', 'first_name', 'last_name', 'specialist', 'designation',
                'educational_qualification', 'photo', 'consultation_fees', 'gender',
                'healineVerified', 'recommended', 'topRated', 'topRatedTitle'
              ],
              include: [
                { model: database.ProfessionType, as: 'professionTypeInfo', attributes: ['id', 'name'] },
                { model: database.Nationalities, as: 'nationalitiesInfo', attributes: ['id', 'name'] },
                {
                  model: database.ProfessionSpeciality,
                  as: 'specialitiesList',
                  attributes: ['speciality_id'],
                  separate: true, // OPTIMIZATION
                  limit: 5,
                  include: [{ model: database.Specialities, as: 'specialityInfo', attributes: ['id', 'name'] }]
                }
              ]
            }]
          },
          {
            model: database.EstablishmentImages,
            as: 'imageList',
            required: false,
            where: imageWhereClause,
            attributes: ['id', 'establishment_id', 'image', 'image_type'],
            separate: true, // OPTIMIZATION
            limit: 5
          },
          {
            model: database.EstablishmentBannerImages,
            as: 'bannerImageList',
            required: false,
            where: bannerImageWhereClause,
            attributes: ['id', 'establishment_id', 'image', 'linkUrl', 'type'],
            separate: true, // OPTIMIZATION
            limit: 5
          },
          {
            model: database.EstablishmentFacilities,
            as: 'facilitiesList',
            attributes: ['id', 'establishment_id', 'facility_id'],
            required: false,
            separate: true, // OPTIMIZATION
            limit: 20,
            include: { model: database.Facilities, as: 'facilityInfo', attributes: ['id', 'name', 'icon', 'description'] }
          },
          { model: database.Department, as: 'departmentList', required: false, attributes: ['id', 'name'], separate: true }
        ],
        offset: offset,
        limit: itemPerPage,
        order: userLat && userLng && !isNaN(userLat) && !isNaN(userLng)
          ? [[literal('distance'), 'ASC']]
          : [['id', 'DESC']],
        subQuery: false // OPTIMIZATION: Avoid subqueries
      });

      console.log(`Returned ${response.length} establishments`);

      const rows = response.map(est => this.processEstablishmentRow(est, image_type, userLat, userLng));

      return dataParse({ count, rows });
    } catch (error) {
      console.error('getEstablishmentSearchListNew error:', error);
      throw error;
    }
  }

  // ========================================
  // OPTIMIZATION: Separate method for single establishment
  // ========================================
  async getSingleEstablishment(establishment_id, image_type, userLat, userLng) {
    const { Op, fn, literal } = database.Sequelize;

    const imageWhereClause = {};
    if (image_type && (image_type === 'main' || image_type === 'gallery')) {
      imageWhereClause.image_type = image_type;
    }

    const bannerImageWhereClause = {};
    if (image_type && image_type === 'banner') {
      bannerImageWhereClause.type = image_type;
    }

    const hasLocation = userLat && userLng && !isNaN(userLat) && !isNaN(userLng);

    const attributes = [
      'id', 'name', 'address', 'about', 'latitude', 'longitude',
      'mobile_country_code', 'contact_number', 'email', 'licence_no',
      'establishment_sub_type', 'is_24_by_7_working', 'primary_photo',
      'healineVerified', 'recommended', 'expertin', 'topRated',
      [literal('4.5'), 'rating'],
      ...(hasLocation
        ? [[fn('ROUND', literal(`(
        6371 * acos(
          GREATEST(-1, LEAST(1,
            cos(radians(${parseFloat(userLat)})) * cos(radians(CAST(\`Establishment\`.\`latitude\` AS DECIMAL(10,8)))) *
            cos(radians(CAST(\`Establishment\`.\`longitude\` AS DECIMAL(11,8))) - radians(${parseFloat(userLng)})) +
            sin(radians(${parseFloat(userLat)})) * sin(radians(CAST(\`Establishment\`.\`latitude\` AS DECIMAL(10,8))))
          ))
        )
      )`), 2), 'distance']]
        : [])
    ];

    console.time('Single Establishment Query');

    // Main establishment query with lightweight associations only
    const establishment = await database.Establishment.findOne({
      where: { id: parseInt(establishment_id) },
      attributes,
      include: [
        {
          model: database.Zones,
          as: 'zoneInfo',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: database.Cities,
          as: 'cityInfo',
          attributes: ['id', 'name', 'zone_id'],
          required: false
        },
        {
          model: database.EstablishmentType,
          as: 'establishmentTypeInfo',
          required: false,
          attributes: ['id', 'name']
        }
      ],
      paranoid: false
    });

    if (!establishment) {
      console.timeEnd('Single Establishment Query');
      return dataParse({ count: 0, rows: [] });
    }

    // Load all associations in parallel for maximum performance
    const [
      specialitiesList,
      // insuranceList,
      servicesList,
      workingHoursDetails,
      professionsList,
      imageList,
      bannerImageList,
      facilitiesList,
      departmentList
    ] = await Promise.all([
      // Specialities
      database.EstablishmentSpeciality.findAll({
        where: { establishment_id: parseInt(establishment_id) },
        attributes: ['id', 'establishment_id', 'speciality_id'],
        limit: 50,
        include: {
          model: database.Specialities,
          as: 'specialityInfo',
          attributes: ['id', 'name', 'icon']
        }
      }),

      // Insurance
      // database.InsuranceEstablishment.findAll({
      //   where: { establishment_id: parseInt(establishment_id) },
      //   attributes: ['id', 'insurance_id', 'establishment_id'],
      //   limit: 50,
      //   include: {
      //     model: database.Insurance,
      //     as: 'insuranceInfo',
      //     attributes: ['id', 'name', 'logo', 'third_party_administrator', 'description', 'banner', 'is_top_insurance']
      //   }
      // }),

      // Services
      database.EstablishmentService.findAll({
        where: { establishment_id: parseInt(establishment_id) },
        attributes: ['id', 'establishment_id', 'service_id'],
        limit: 50,
        include: {
          model: database.Service,
          as: 'name',
          attributes: ['id', 'name']
        }
      }),

      // Working Hours
      database.EstablishmentWorkingHour.findAll({
        where: { establishment_id: parseInt(establishment_id) },
        attributes: ['day_of_week', 'start_time', 'end_time', 'is_day_off']
      }),

      // Professions (with nested includes)
      database.ProfessionDepartment.findAll({
        where: { establishment_id: parseInt(establishment_id) },
        attributes: ['proffession_id', 'establishment_id'],
        limit: 50,
        include: [{
          model: database.Profession,
          as: 'professionInfo',
          attributes: [
            'id', 'first_name', 'last_name', 'specialist', 'designation',
            'educational_qualification', 'photo', 'consultation_fees',
            'gender', 'healineVerified', 'recommended', 'topRated', 'topRatedTitle'
          ],
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
              separate: true,
              limit: 10,
              include: [{
                model: database.Specialities,
                as: 'specialityInfo',
                attributes: ['id', 'name']
              }]
            }
          ]
        }]
      }),

      // Images
      database.EstablishmentImages.findAll({
        where: {
          establishment_id: parseInt(establishment_id),
          ...(Object.keys(imageWhereClause).length > 0 ? imageWhereClause : {})
        },
        attributes: ['id', 'establishment_id', 'image', 'image_type'],
        limit: 100
      }),

      // Banner Images
      database.EstablishmentBannerImages.findAll({
        where: {
          establishment_id: parseInt(establishment_id),
          ...(Object.keys(bannerImageWhereClause).length > 0 ? bannerImageWhereClause : {})
        },
        attributes: ['id', 'establishment_id', 'image', 'linkUrl', 'type'],
        limit: 50
      }),

      // Facilities
      database.EstablishmentFacilities.findAll({
        where: { establishment_id: parseInt(establishment_id) },
        attributes: ['id', 'establishment_id', 'facility_id'],
        limit: 50,
        include: {
          model: database.Facilities,
          as: 'facilityInfo',
          attributes: ['id', 'name', 'icon', 'description']
        }
      }),

      // Departments
      database.Department.findAll({
        where: { establishment_id: parseInt(establishment_id) },
        attributes: ['id', 'name'],
        limit: 50
      })
    ]);

    console.timeEnd('Single Establishment Query');

    // Attach all associations to establishment
    establishment.dataValues.specialitiesList = specialitiesList;
    // establishment.dataValues.insuranceList = insuranceList;
    establishment.dataValues.servicesList = servicesList;
    establishment.dataValues.workingHoursDetails = workingHoursDetails;
    establishment.dataValues.professionsList = professionsList;
    establishment.dataValues.imageList = imageList;
    establishment.dataValues.bannerImageList = bannerImageList;
    establishment.dataValues.facilitiesList = facilitiesList;
    establishment.dataValues.departmentList = departmentList;

    // Process and return
    const processedRow = this.processEstablishmentRow(
      establishment,
      image_type,
      userLat,
      userLng
    );

    return dataParse({ count: 1, rows: [processedRow] });
  }

  // ========================================
  // OPTIMIZATION: Extract row processing
  // ========================================
  processEstablishmentRow(est, image_type, userLat, userLng) {
    const now = moment();

    // Process images
    if (est.dataValues.imageList && est.dataValues.imageList.length > 0) {
      est.dataValues.imageList = est.dataValues.imageList.map(img => ({
        ...img.dataValues || img,
        image: img.image ? `${img.image}` : null
      }));
    }

    if (est.dataValues.bannerImageList && est.dataValues.bannerImageList.length > 0) {
      est.dataValues.bannerImageList = est.dataValues.bannerImageList.map(img => ({
        ...img.dataValues || img,
        image: img.image ? `${img.image}` : null
      }));
    }

    // Process working hours
    const todaysWh = est.workingHoursDetails?.[0] || null;
    est.dataValues.isOpenNow = todaysWh && !todaysWh.is_day_off &&
      moment(todaysWh.start_time, 'HH:mm:ss').isSameOrBefore(now) &&
      moment(todaysWh.end_time, 'HH:mm:ss').isAfter(now);

    // Add computed fields
    est.dataValues.doctorsCount = est.professionsList?.length || 0;
    // est.dataValues.insuranceAccepted = !!est.insuranceList?.length;
    // est.dataValues.insuranceCount = est.insuranceList?.length || 0;
    est.dataValues.filteredImagesCount = est.imageList?.length || 0;
    est.dataValues.bannerImagesCount = est.bannerImageList?.length || 0;

    if (image_type && est.imageList?.length > 0) {
      est.dataValues.imageFilterType = image_type;
    }
    if (image_type === 'banner' && est.bannerImageList?.length > 0) {
      est.dataValues.imageFilterType = image_type;
    }
    if (userLat && userLng && est.dataValues.distance !== undefined) {
      est.dataValues.distanceKm = `${est.dataValues.distance} km`;
    }
    if (est.dataValues.topRated) {
      est.dataValues.topRatedTitle = '';
    }

    return est.dataValues;
  }


  // async getEstablishmentDetail(establishment_id, image_type = null) {
  //   try {
  //     var imageWhereClause = {};
  //     if (image_type && (image_type === 'main' || image_type === 'gallery')) {
  //       imageWhereClause.image_type = image_type;
  //     }

  //     const today = moment().day();
  //     const nowTimeStr = moment().format('HH:mm:ss');

  //     const response = await database.Establishment.findOne({
  //       where: { id: establishment_id },
  //       attributes: {
  //         include: [
  //           [literal('4.5'), 'rating'],
  //           'id',
  //           'licence_no',
  //           'establishment_type',
  //           'name',
  //           'address',
  //           'city_id',
  //           'zone_id',
  //           'pin_code',
  //           'latitude',
  //           'longitude',
  //           'email',
  //           'establishment_sub_type',
  //           'contact_number',
  //           'primary_photo',
  //           'is_24_by_7_working',
  //           'healineVerified',
  //           'about',
  //           'created_at',
  //           'updated_at',
  //           'deleted_at'
  //         ]
  //       },
  //       include: [
  //         {
  //           model: database.Zones,
  //           as: 'zoneInfo',
  //           attributes: ['id', 'name']
  //         },
  //         {
  //           model: database.Cities,
  //           as: 'cityInfo',
  //           attributes: ['id', 'name', 'zone_id']
  //         },
  //         {
  //           model: database.EstablishmentType,
  //           as: 'establishmentTypeInfo',
  //           attributes: ['id', 'name']
  //         },
  //         {
  //           model: database.EstablishmentSpeciality,
  //           as: 'specialitiesList',
  //           required: false,
  //           attributes: ['id', 'establishment_id', 'speciality_id'],
  //           include: {
  //             model: database.Specialities,
  //             as: 'specialityInfo',
  //             attributes: ['id', 'name']
  //           }
  //         },
  //         // {
  //         //   model: database.InsuranceEstablishment,
  //         //   as: 'insuranceList',
  //         //   required: false,
  //         //   attributes: ['id', 'insurance_id', 'establishment_id'],
  //         //   include: {
  //         //     model: database.Insurance,
  //         //     as: 'insuranceInfo',
  //         //     attributes: ['id', 'name', 'logo', 'third_party_administrator', 'description', 'banner', 'is_top_insurance']
  //         //   }
  //         // },
  //         {
  //           model: database.EstablishmentService,
  //           as: 'servicesList',
  //           required: false,
  //           attributes: ['id', 'establishment_id', 'service_id'],
  //           include: {
  //             model: database.Service,
  //             as: 'name',
  //             attributes: ['id', 'name']
  //           }
  //         },
  //         {
  //           model: database.EstablishmentImages,
  //           as: 'imageList',
  //           required: false,
  //           where: imageWhereClause,
  //           attributes: ['id', 'establishment_id', 'image', 'image_type']
  //         },
  //         {
  //           model: database.EstablishmentWorkingHour,
  //           as: 'workingHoursDetails',
  //           required: false,
  //           attributes: ['id', 'establishment_id', 'day_of_week', 'start_time', 'end_time', 'is_day_off']
  //         },
  //         {
  //           model: database.EstablishmentFacilities,
  //           as: 'facilitiesList',
  //           required: false,
  //           attributes: ['id', 'establishment_id', 'facility_id'],
  //           include: {
  //             model: database.Facilities,
  //             as: 'facilityInfo',
  //             attributes: ['id', 'name']
  //           }
  //         },
  //         {
  //           model: database.Department,
  //           as: 'departmentList',
  //           required: false,
  //           attributes: ['id', 'name']
  //         },
  //         {
  //           model: database.ProfessionDepartment,
  //           as: 'professionsList',
  //           required: false,
  //           attributes: ['proffession_id', 'establishment_id'],
  //           include: [{
  //             model: database.Profession,
  //             as: 'professionInfo',
  //             attributes: [
  //               'id',
  //               'first_name',
  //               'last_name',
  //               'specialist',
  //               'designation',
  //               'educational_qualification',
  //               'photo',
  //               'consultation_fees',
  //               'gender',
  //               'healineVerified'
  //             ],
  //             include: [
  //               {
  //                 model: database.ProfessionType,
  //                 as: 'professionTypeInfo',
  //                 attributes: ['id', 'name']
  //               },
  //               {
  //                 model: database.Nationalities,
  //                 as: 'nationalitiesInfo',
  //                 attributes: ['id', 'name']
  //               },
  //               {
  //                 model: database.ProfessionSpeciality,
  //                 as: 'specialitiesList',
  //                 attributes: ['speciality_id'],
  //                 include: [{
  //                   model: database.Specialities,
  //                   as: 'specialityInfo',
  //                   attributes: ['id', 'name']
  //                 }]
  //               }
  //             ]
  //           }]
  //         }
  //       ]
  //     });

  //     if (!response) {
  //       return null;
  //     }

  //     const now = moment();

  //     const todaysWh = response.workingHoursDetails.find(wh => wh.day_of_week === today) || null;
  //     if (!todaysWh || todaysWh.is_day_off) {
  //       response.dataValues.isOpenNow = false;
  //     } else {
  //       const start = moment(todaysWh.start_time, 'HH:mm:ss');
  //       const end = moment(todaysWh.end_time, 'HH:mm:ss');
  //       response.dataValues.isOpenNow = now.isSameOrAfter(start) && now.isBefore(end);
  //     }

  //     response.dataValues.doctorsCount = response.professionsList ? response.professionsList.length : 0;
  //     // response.dataValues.insuranceAccepted = response.insuranceList && response.insuranceList.length > 0;
  //     // response.dataValues.insuranceCount = response.insuranceList ? response.insuranceList.length : 0;

  //     response.dataValues.filteredImagesCount = response.imageList ? response.imageList.length : 0;
  //     if (image_type) {
  //       response.dataValues.imageFilterType = image_type;
  //     }

  //     return dataParse(response);
  //   } catch (error) {
  //     console.log('getEstablishmentDetail error:', error);
  //     throw error;
  //   }
  // }
  async getProfessionSearchList(specility_id, profession_type) {
    try {
      var sepciArr = [];
      if (specility_id && specility_id.length > 0) {
        sepciArr = specility_id.map((item) => +item);
      }
      let ProfessionSpecialitywhereClause = {};
      if (sepciArr.length > 0) {
        ProfessionSpecialitywhereClause.speciality_id = { [Op.in]: sepciArr };
      }
      const response = await database.Profession.findAll({
        attributes: {
          include: ['healineVerified', 'recommended', 'topRated'] // Include healineVerified
        },
        include: [
          {
            model: database.ProfessionType,
            as: 'professionTypeInfo',
            required: true,
            attributes: ['id', 'name'],
            where: {
              name: { [Op.in]: [profession_type] }
            }
          },
          {
            model: database.Nationalities,
            as: 'nationalitiesInfo',
            attributes: ['id', 'name', 'icon']
          },
          {
            model: database.ProfessionSpeciality,
            attributes: ['id', 'proffession_id', 'speciality_id'],
            as: 'specialitiesList',
            ...(sepciArr.length > 0 && {
              where: ProfessionSpecialitywhereClause
            }),
            include: {
              model: database.Specialities,
              as: 'specialityInfo',
              attributes: ['id', 'name']
            }
          }
        ]
      });
      return dataParse(response);
    } catch (error) {
      console.log('error', error);
    }
  }


  async getProfessionsDetail(id) {
    try {
      const response = await database.Profession.findOne({
        where: {
          id: id
        },
        attributes: {
          include: ['healineVerified', 'recommended', 'topRated'] // Include healineVerified and recommended
        },
        include: [
          {
            model: database.ProfessionType,
            as: 'professionTypeInfo',
            required: true,
            attributes: ['id', 'name']
          },
          {
            model: database.Nationalities,
            as: 'nationalitiesInfo',
            attributes: ['id', 'name', 'icon']
          },
          {
            model: database.ProfessionLanguage,
            as: 'languagesList',
            attributes: ['id', 'language_id'],
            include: {
              model: database.Language,
              as: 'languageInfo',
              attributes: ['id', 'language']
            }
          },
          {
            model: database.ProfessionSpeciality,
            attributes: ['id', 'proffession_id', 'speciality_id'],
            as: 'specialitiesList',
            require: true,
            include: {
              model: database.Specialities,
              as: 'specialityInfo',
              attributes: ['id', 'name']
            }
          },
          // ADD WORKING HOURS INFORMATION
          {
            model: database.profession_working_hours,
            as: 'working_hours',
            attributes: ['day_of_week', 'start_time', 'end_time', 'is_day_off']
          },
          // ADD ESTABLISHMENT DETAILS WITH INSURANCE INFORMATION
          {
            model: database.ProfessionDepartment,
            as: 'professionDepartmentsList',
            attributes: ['id', 'establishment_id'],
            include: {
              model: database.Establishment,
              as: 'establishmentInfo',
              attributes: [
                'id', 'name', 'address', 'latitude', 'longitude',
                'email', 'contact_number', 'primary_photo', 'pin_code',
                'healineVerified', 'recommended', 'topRated', 'topRatedTitle'
              ],
              include: [
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
                  model: database.EstablishmentType,
                  as: 'establishmentTypeInfo',
                  attributes: ['id', 'name']
                },
                // ADD INSURANCE INFORMATION
                // {
                //   model: database.InsuranceEstablishment,
                //   as: 'insuranceList',
                //   attributes: ['id', 'insurance_id', 'establishment_id'],
                //   required: false,
                //   include: {
                //     model: database.Insurance,
                //     as: 'insuranceInfo',
                //     attributes: ['id', 'name', 'logo']
                //   }
                // }
              ]
            }
          }
        ]
      });

      if (response) {
        const professionData = dataParse(response);

        if (professionData.topRated) {
          professionData.topRatedTitle = '';
        } else {
          delete professionData.topRatedTitle; // Ensure topRateTitle is not included if topRated is false
        }
        // ADD INSURANCE LOGIC FOR PROFESSION DETAIL
        // let professionInsuranceAccepted = false;
        // // let professionInsuranceList = [];

        // if (professionData.professionDepartmentsList && professionData.professionDepartmentsList.length > 0) {
        //   // Check all establishments where this profession works
        //   for (const profDept of professionData.professionDepartmentsList) {
        //     if (profDept.establishmentInfo && profDept.establishmentInfo.insuranceList) {
        //       const establishmentInsurances = profDept.establishmentInfo.insuranceList;
        //       if (establishmentInsurances.length > 0) {
        //         professionInsuranceAccepted = true;
        //         // Add unique insurances to the profession's insurance list
        //         establishmentInsurances.forEach(insEst => {
        //           if (insEst.insuranceInfo && !professionInsuranceList.find(ins => ins.id === insEst.insuranceInfo.id)) {
        //             professionInsuranceList.push({
        //               id: insEst.insuranceInfo.id,
        //               name: insEst.insuranceInfo.name,
        //               logo: insEst.insuranceInfo.logo,
        //               establishment_id: profDept.establishmentInfo.id,
        //               establishment_name: profDept.establishmentInfo.name
        //             });
        //           }
        //         });
        //       }
        //     }
        //   }
        // }

        // // Set the insurance fields for the profession
        // professionData.insuranceAccepted = professionInsuranceAccepted;
        // professionData.acceptedInsurances = professionInsuranceList;
        // professionData.insuranceCount = professionInsuranceList.length;

        // Add establishmentsList and establishmentInfo for consistency with searchProfessionalsAdvanced
        professionData.establishmentsList = professionData.professionDepartmentsList || [];
        if (professionData.professionDepartmentsList && professionData.professionDepartmentsList.length > 0) {
          professionData.establishmentInfo = professionData.professionDepartmentsList[0].establishmentInfo || null;
        }

        return professionData;
      }

      return dataParse(response);
    } catch (error) {
      console.log('error', error);
    }
  }

  //   async getEstablishmentDetail(establishment_id, image_type = null) {
  //   try {
  //     // Image filtering logic
  //     var imageWhereClause = {};
  //     if (image_type && (image_type === 'main' || image_type === 'gallery')) {
  //       imageWhereClause.image_type = image_type;
  //     }

  //     const today = moment().day();
  //     const nowTimeStr = moment().format('HH:mm:ss');

  //     const response = await database.Establishment.findOne({
  //       where: { id: establishment_id },
  //       attributes: {
  //         include: [
  //           [literal('4.5'), 'rating']
  //         ]
  //       },
  //       include: [
  //         {
  //           model: database.Zones,
  //           as: 'zoneInfo',
  //           attributes: ['id', 'name']
  //         },
  //         {
  //           model: database.Cities,
  //           as: 'cityInfo',
  //           attributes: ['id', 'name', 'zone_id']
  //         },
  //         {
  //           model: database.EstablishmentType,
  //           as: 'establishmentTypeInfo',
  //           attributes: ['id', 'name']
  //         },
  //         {
  //           model: database.EstablishmentSpeciality,
  //           as: 'specialitiesList',
  //           required: false,
  //           attributes: ['id', 'establishment_id', 'speciality_id'],
  //           include: {
  //             model: database.Specialities,
  //             as: 'specialityInfo',
  //             attributes: ['id', 'name']
  //           }
  //         },
  //         // {
  //         //   model: database.InsuranceEstablishment,
  //         //   as: 'insuranceList',
  //         //   required: false,
  //         //   attributes: ['id', 'insurance_id', 'establishment_id'],
  //         //   include: {
  //         //     model: database.Insurance,
  //         //     as: 'insuranceInfo',
  //         //     attributes: ['id', 'name']
  //         //   }
  //         // },
  //         {
  //           model: database.EstablishmentService,
  //           as: 'servicesList',
  //           required: false,
  //           attributes: ['id', 'establishment_id', 'service_id'],
  //           include: {
  //             model: database.Service,
  //             as: 'name',
  //             attributes: ['id', 'name']
  //           }
  //         },
  //         {
  //           model: database.EstablishmentImages,
  //           as: 'imageList',
  //           required: false,
  //           where: imageWhereClause,
  //           attributes: ['id', 'establishment_id', 'image', 'image_type']
  //         },
  //         {
  //           model: database.EstablishmentWorkingHour,
  //           as: 'workingHoursDetails',
  //           required: false,
  //           where: {
  //             day_of_week: today
  //           },
  //           attributes: ['start_time', 'end_time', 'is_day_off']
  //         },
  //         {
  //           model: database.EstablishmentFacilities,
  //           as: 'facilitiesList',
  //           required: false,
  //           attributes: ['id', 'establishment_id', 'facility_id'],
  //           include: {
  //             model: database.Facilities,
  //             as: 'facilityInfo',
  //             attributes: ['id', 'name']
  //           }
  //         },
  //         {
  //           model: database.Department,
  //           as: 'departmentList',
  //           required: false,
  //           attributes: ['id', 'name']
  //         },
  //         {
  //           model: database.ProfessionDepartment,
  //           as: 'professionsList',
  //           required: false,
  //           attributes: ['proffession_id', 'establishment_id'],
  //           include: [{
  //             model: database.Profession,
  //             as: 'professionInfo',
  //             attributes: [
  //               'id',
  //               'first_name',
  //               'last_name',
  //               'specialist',
  //               'designation',
  //               'educational_qualification',
  //               'photo',
  //               'consultation_fees',
  //               'gender',
  //               'healineVerified'
  //             ],
  //             include: [
  //               {
  //                 model: database.ProfessionType,
  //                 as: 'professionTypeInfo',
  //                 attributes: ['id', 'name']
  //               },
  //               {
  //                 model: database.Nationalities,
  //                 as: 'nationalitiesInfo',
  //                 attributes: ['id', 'name']
  //               },
  //               {
  //                 model: database.ProfessionSpeciality,
  //                 as: 'specialitiesList',
  //                 attributes: ['speciality_id'],
  //                 include: [{
  //                   model: database.Specialities,
  //                   as: 'specialityInfo',
  //                   attributes: ['id', 'name']
  //                 }]
  //               }
  //             ]
  //           }]
  //         }
  //       ]
  //     });

  //     if (!response) {
  //       return null;
  //     }

  //     const now = moment();

  //     // Handle working hours and isOpenNow
  //     const wh = response.workingHoursDetails && response.workingHoursDetails.length > 0 ? response.workingHoursDetails[0] : null;
  //     if (!wh || wh.is_day_off) {
  //       response.dataValues.isOpenNow = false;
  //     } else {
  //       const start = moment(wh.start_time, 'HH:mm:ss');
  //       const end = moment(wh.end_time, 'HH:mm:ss');
  //       response.dataValues.isOpenNow = now.isSameOrAfter(start) && now.isBefore(end);
  //     }

  //     // Add computed fields
  //     response.dataValues.doctorsCount = response.professionsList ? response.professionsList.length : 0;
  //     // response.dataValues.insuranceAccepted = response.insuranceList && response.insuranceList.length > 0;

  //     // Add image filtering results info
  //     if (response.imageList && response.imageList.length > 0) {
  //       response.dataValues.filteredImagesCount = response.imageList.length;
  //       if (image_type) {
  //         response.dataValues.imageFilterType = image_type;
  //       }
  //     } else {
  //       response.dataValues.filteredImagesCount = 0;
  //     }

  //     return dataParse(response);
  //   } catch (error) {
  //     console.log('getEstablishmentDetail error:', error);
  //     throw error;
  //   }
  // }


  async getDoctorPracticeLocations(id) {
    try {
      var dayOfWeek = moment().day();
      const prfDept = await database.ProfessionDepartment.findAll({
        where: {
          proffession_id: id,
          establishment_id: { [Op.gt]: 0 }
        }
      });
      var prfDeptData = dataParse(prfDept);
      if (prfDeptData.length > 0) {
        var establishMentIds = [];
        for (const i of prfDeptData) {
          establishMentIds.push(i.establishment_id);
        }

        if (establishMentIds.length > 0) {
          const establishments = await database.Establishment.findAll({
            where: {
              id: { [Op.in]: establishMentIds }
            },
            include: [
              {
                model: database.EstablishmentType,
                as: 'establishmentTypeInfo',
                required: true,
                attributes: ['id', 'name']
              },
              {
                model: database.EstablishmentWorkingHour,
                as: 'todayWorkingHoursDetails',
                attributes: ['id', 'start_time', 'end_time', 'is_day_off'],
                required: false,
                where: {
                  day_of_week: dayOfWeek
                }
              }
            ]
          });
          return dataParse(establishments);
        } else {
          return [];
        }
      } else {
        return [];
      }
    } catch (error) {
      console.log('error', error);
    }
  }
  async getUserBookmarkList(userId) {
    try {
      const response = await database.Bookmark.findAll({
        where: {
          user_id: userId
        },
        include: [
          {
            model: database.Establishment,
            as: 'establishmentInfo',
            required: true,
            include: [
              {
                model: database.EstablishmentType,
                as: 'establishmentTypeInfo',
                attributes: ['id', 'name']
              },
              {
                model: database.Department,
                as: 'departmentList',
                attributes: ['id', 'name', 'establishment_id'],
                include: {
                  model: database.DepartmentSpeciality,
                  attributes: ['id', 'dept_id', 'speciality_id'],
                  as: 'specialitiesList',
                  include: {
                    model: database.Specialities,
                    as: 'specialityInfo',
                    attributes: ['id', 'name']
                  }
                }
              }
            ]
          }
        ]
      });
      return dataParse(response);
    } catch (error) {
      console.log('error', error);
    }
  }
  // async getInsurancesList(isTopInsurance, search_text) {
  //   try {
  //     var whereClause = {};
  //     if (isTopInsurance && isTopInsurance == 1) {
  //       whereClause.is_top_insurance = isTopInsurance;
  //     }
  //     if (search_text && search_text != '') {
  //       whereClause.name = { [Op.like]: '%' + search_text + '%' };
  //     }
  //     const response = await database.Insurance.findAll({
  //       where: whereClause,
  //       include: [
  //         {
  //           model: database.InsurancePlan,
  //           as: 'planList',
  //           attributes: ['id', 'name']
  //         }
  //       ]
  //     });
  //     return dataParse(response);
  //   } catch (error) {
  //     console.log('error', error);
  //   }
  // }
  // async getHealthTestList(categoryId, search_text) {
  //   try {
  //     var whereClause = {};
  //     if (categoryId && +categoryId > 0) {
  //       whereClause.category_id = categoryId;
  //     }
  //     if (search_text && search_text != '') {
  //       whereClause.name = { [Op.like]: '%' + search_text + '%' };
  //     }
  //     const response = await database.HealthTest.findAll({
  //       where: whereClause,
  //       attributes: ['id', 'name', 'category_id', 'price', 'discounted_price'],
  //       include: [
  //         {
  //           model: database.HealthTestCategory,
  //           as: 'categoryInfo',
  //           attributes: ['id', 'name']
  //         },
  //         {
  //           model: database.HealthTestImage,
  //           as: 'imageList',
  //           attributes: ['image']
  //         }
  //       ]
  //     });
  //     return dataParse(response);
  //   } catch (error) {
  //     console.log('error', error);
  //   }
  // }
  // async getHealthTestDetail(testId) {
  //   try {
  //     var whereClause = {};

  //     whereClause.id = testId;

  //     const response = await database.HealthTest.findOne({
  //       where: whereClause,
  //       include: [
  //         {
  //           model: database.HealthTestCategory,
  //           as: 'categoryInfo',
  //           attributes: ['id', 'name']
  //         },
  //         {
  //           model: database.HealthTestImage,
  //           as: 'imageList',
  //           attributes: ['image']
  //         }
  //       ]
  //     });
  //     return dataParse(response);
  //   } catch (error) {
  //     console.log('error', error);
  //   }
  // }
  async searchProfessionalsAdvanced({
    latitude,
    longitude,
    available,
    search_text,
    gender,
    language_id,
    category_id,
    offset = 0,
    limit = 10,
    establishment_id,
    available_today,
    // insurance_id,
    slot,
    facility_id,
    acceptsInsurance,
    healineVerified,
    recommended,
    topRated,
    profession_id,
    onlyOnline = false
  }) {
    const Profession = database.Profession;
    const ProfessionLanguage = database.ProfessionLanguage;
    const ProfessionSpeciality = database.ProfessionSpeciality;
    const ProfessionWorkingHours = database.profession_working_hours;
    const ProfessionDepartment = database.ProfessionDepartment;
    // const InsuranceEstablishment = database.InsuranceEstablishment;
    const EstablishmentFacilities = database.EstablishmentFacilities;

    const where = { deleted_at: null };
    if (profession_id) {
      where.id = profession_id;
    }
    healineVerified = (healineVerified === true || healineVerified === 'true');
    recommended = (recommended === true || recommended === 'true');
    topRated = (topRated === true || topRated === 'true');

    if (healineVerified) {
      where.healineVerified = true;
    }
    if (recommended) {
      where.recommended = true;
    }
    if (topRated) {
      where.topRated = true;
    }

    if (available !== undefined) where.available = available === '1';

    if (search_text) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search_text}%` } },
        { last_name: { [Op.like]: `%${search_text}%` } }
      ];
    }

    const genderKeywordToSpecialties = {
      women: ['gynecology', 'obstetrics and gynecology', 'female'],
      kids: ['pediatrics', 'neonatology', 'child', 'children'],
      men: ['urology', 'andrology', 'male']
    };

    let specialtyFilters = [];
    if (gender && genderKeywordToSpecialties[gender.toLowerCase()]) {
      const mappedKeywords = genderKeywordToSpecialties[gender.toLowerCase()];
      const allSpecialties = await database.Specialities.findAll({
        where: {
          [Op.and]: [
            { deleted_at: null },
            {
              [Op.or]: mappedKeywords.map(kw => ({
                name: {
                  [Op.like]: `%${kw}%`
                }
              }))
            }
          ]
        },
        attributes: ['id']
      });
      specialtyFilters = allSpecialties.map(s => s.id);
    }

    // if (acceptsInsurance === true) {
    //   const insuranceEstablishments = await InsuranceEstablishment.findAll({
    //     attributes: ['establishment_id'],
    //     group: ['establishment_id']
    //   });

    //   const establishmentIds = insuranceEstablishments.map(e => e.establishment_id);

    //   if (establishmentIds.length > 0) {
    //     const professionDepartments = await ProfessionDepartment.findAll({
    //       where: { establishment_id: establishmentIds },
    //       attributes: ['proffession_id'],
    //       group: ['proffession_id']
    //     });

    //     if (onlyOnline === true) {
    //       where.online_consultation = false;
    //     }

    //     const professionIds = professionDepartments.map(pd => pd.proffession_id);
    //     if (professionIds.length > 0) {
    //       where.id = professionIds;
    //     } else {
    //       return dataParse({ rows: [], count: 0 });
    //     }
    //   } else {
    //     return dataParse({ rows: [], count: 0 });
    //   }
    // }

    // if (insurance_id) {
    //   const insuranceEstablishments = await InsuranceEstablishment.findAll({
    //     where: { insurance_id },
    //     attributes: ['establishment_id']
    //   });
    //   const establishmentIds = insuranceEstablishments.map(e => e.establishment_id);
    //   if (establishmentIds.length > 0) {
    //     const professionDepartments = await ProfessionDepartment.findAll({
    //       where: { establishment_id: establishmentIds },
    //       attributes: ['proffession_id']
    //     });
    //     const professionIds = professionDepartments.map(pd => pd.proffession_id);
    //     if (professionIds.length > 0) {
    //       where.id = professionIds;
    //     } else {
    //       return dataParse({ rows: [], count: 0 });
    //     }
    //   } else {
    //     return dataParse({ rows: [], count: 0 });
    //   }
    // }

    if (facility_id) {
      const facilityEstablishments = await EstablishmentFacilities.findAll({
        where: { facility_id },
        attributes: ['establishment_id']
      });
      const establishmentIds = facilityEstablishments.map(e => e.establishment_id);
      if (establishmentIds.length > 0) {
        const professionDepartments = await ProfessionDepartment.findAll({
          where: { establishment_id: establishmentIds },
          attributes: ['proffession_id']
        });
        const professionIds = professionDepartments.map(pd => pd.proffession_id);
        if (professionIds.length > 0) {
          where.id = professionIds;
        } else {
          return dataParse({ rows: [], count: 0 });
        }
      } else {
        return dataParse({ rows: [], count: 0 });
      }
    }

    if (establishment_id) {
      const professionDepartments = await ProfessionDepartment.findAll({
        where: { establishment_id },
        attributes: ['proffession_id']
      });
      const professionIds = professionDepartments.map(pd => pd.proffession_id);
      if (professionIds.length > 0) {
        where.id = professionIds;
      } else {
        return dataParse({ rows: [], count: 0 });
      }
    }

    let slotWhere = undefined;
    if (slot) {
      if (slot === 'morning') {
        slotWhere = {
          start_time: { [Op.lte]: '12:00:00' },
          end_time: { [Op.gte]: '06:00:00' },
          is_day_off: false
        };
      } else if (slot === 'afternoon') {
        slotWhere = {
          start_time: { [Op.lte]: '17:00:00' },
          end_time: { [Op.gte]: '12:00:00' },
          is_day_off: false
        };
      } else if (slot === 'evening') {
        slotWhere = {
          start_time: { [Op.lte]: '21:00:00' },
          end_time: { [Op.gte]: '17:00:00' },
          is_day_off: false
        };
      }
    }

    const include = [];

    if (language_id) {
      include.push({
        model: ProfessionLanguage,
        as: 'languagesList',
        required: true,
        where: { language_id },
        include: {
          model: database.Language,
          as: 'languageInfo',
          attributes: ['id', 'language']
        }
      });
    } else {
      include.push({
        model: ProfessionLanguage,
        as: 'languagesList',
        include: {
          model: database.Language,
          as: 'languageInfo',
          attributes: ['id', 'language']
        }
      });
    }

    if (category_id || specialtyFilters.length > 0) {
      const specialtyWhere = {};
      if (category_id && specialtyFilters.length > 0) {
        specialtyWhere[Op.or] = [
          { speciality_id: category_id },
          { speciality_id: specialtyFilters }
        ];
      } else if (category_id) {
        specialtyWhere.speciality_id = category_id;
      } else if (specialtyFilters.length > 0) {
        specialtyWhere.speciality_id = specialtyFilters;
      }

      include.push({
        model: ProfessionSpeciality,
        as: 'specialitiesList',
        required: true,
        where: specialtyWhere,
        include: {
          model: database.Specialities,
          as: 'specialityInfo',
          attributes: ['id', 'name']
        }
      });
    } else {
      include.push({
        model: ProfessionSpeciality,
        as: 'specialitiesList',
        include: {
          model: database.Specialities,
          as: 'specialityInfo',
          attributes: ['id', 'name']
        }
      });
    }

    if (gender && !specialtyFilters.length) {
      where.gender = gender;
    }

    if (available_today === '1' || slotWhere) {
      const today = moment().day();
      include.push({
        model: ProfessionWorkingHours,
        as: 'working_hours',
        required: true,
        where: {
          day_of_week: today,
          ...(slotWhere || { is_day_off: false })
        },
        attributes: ['day_of_week', 'start_time', 'end_time', 'is_day_off']
      });
    } else {
      include.push({
        model: ProfessionWorkingHours,
        as: 'working_hours',
        attributes: ['day_of_week', 'start_time', 'end_time', 'is_day_off']
      });
    }

    include.push({
      model: database.Nationalities,
      as: 'nationalitiesInfo',
      attributes: ['id', 'name', 'icon']
    });

    include.push({
      model: database.ProfessionType,
      as: 'professionTypeInfo',
      attributes: ['id', 'name']
    });

    include.push({
      model: ProfessionDepartment,
      as: 'professionDepartmentsList',
      attributes: ['id', 'establishment_id'],
      include: {
        model: database.Establishment,
        as: 'establishmentInfo',
        attributes: [
          'id', 'name', 'address', 'latitude', 'longitude',
          'email', 'contact_number', 'primary_photo', 'pin_code',
          'healineVerified', 'recommended', 'topRated', 'topRatedTitle'
        ],
        include: [
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
            model: database.EstablishmentType,
            as: 'establishmentTypeInfo',
            attributes: ['id', 'name']
          },
          // {
          //   model: database.InsuranceEstablishment,
          //   as: 'insuranceList',
          //   attributes: ['id', 'insurance_id', 'establishment_id'],
          //   required: false,
          //   include: {
          //     model: database.Insurance,
          //     as: 'insuranceInfo',
          //     attributes: ['id', 'name', 'logo']
          //   }
          // }
        ]
      }
    });

    const attributes = {
      include: ['healineVerified', 'recommended', 'topRated', 'topRatedTitle', 'created_at', 'updated_at', 'deleted_at']
    };

    // IMPROVED: More precise distance calculation and filtering
    let hasLocation = false;
    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      hasLocation = true;
      console.log(`Searching professionals with coordinates: ${lat}, ${lng}`);

      // Check for other filters
      const hasOtherFilters =
        available !== undefined ||
        search_text ||
        gender ||
        language_id ||
        category_id ||
        establishment_id ||
        available_today ||
        // insurance_id ||
        slot ||
        facility_id ||
        acceptsInsurance ||
        healineVerified ||
        recommended ||
        topRated ||
        onlyOnline;

      // Add distance calculation
      attributes.include.push([
        fn('ROUND', literal(`(
          6371 * acos(
            GREATEST(-1, LEAST(1,
              cos(radians(${lat})) * cos(radians(CAST(\`Profession\`.\`latitude\` AS DECIMAL(10,8)))) *
              cos(radians(CAST(\`Profession\`.\`longitude\` AS DECIMAL(11,8))) - radians(${lng})) +
              sin(radians(${lat})) * sin(radians(CAST(\`Profession\`.\`latitude\` AS DECIMAL(10,8))))
            ))
          )
        )`), 2), 'distance']
      );

      // Filter by coordinates existence
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push({
        latitude: { [Op.not]: null },
        longitude: { [Op.not]: null }
      });

      // Apply 5km radius filter only if no other filters (pure location search)
      if (!hasOtherFilters) {
        where[Op.and].push(
          literal(`(
            6371 * acos(
              GREATEST(-1, LEAST(1,
                cos(radians(${lat})) * cos(radians(CAST(\`Profession\`.\`latitude\` AS DECIMAL(10,8)))) *
                cos(radians(CAST(\`Profession\`.\`longitude\` AS DECIMAL(11,8))) - radians(${lng})) +
                sin(radians(${lat})) * sin(radians(CAST(\`Profession\`.\`latitude\` AS DECIMAL(10,8))))
              ))
            )
          ) <= 5`)
        );
      }
      // When other filters are present, the 5km limit is not applied, and results are sorted by distance
    }

    // Debug: Log the total count without distance filter first (if location search)
    if (hasLocation) {
      const totalCount = await Profession.count({
        where: {
          ...where,
          [Op.and]: (where[Op.and] || []).filter(condition =>
            !condition[Op.and] || typeof condition[Op.and] !== 'object'
          )
        },
        include: include.map(inc => ({ ...inc, required: inc.required || false })),
        distinct: true
      });
      console.log(`Total professionals (before distance filter): ${totalCount}`);
    }

    const result = await Profession.findAndCountAll({
      where,
      include,
      attributes,
      offset,
      limit,
      distinct: true,
      order: hasLocation
        ? [[literal('distance'), 'ASC']]
        : [['id', 'DESC']]
    });

    // Log results for debugging
    console.log(`Found ${result.count} professionals${hasLocation ? ' within search radius' : ''}`);
    if (result.rows.length > 0 && hasLocation) {
      result.rows.forEach(prof => {
        if (prof.dataValues.distance !== undefined) {
          console.log(`Professional: ${prof.first_name} ${prof.last_name}, Distance: ${prof.dataValues.distance} km, Coords: ${prof.latitude}, ${prof.longitude}`);
        }
      });
    }

    // Process each professional with async operations
    for (const item of result.rows) {
      item.dataValues.rating = 4.5;

      if (!item.dataValues.topRated) {
        delete item.dataValues.topRatedTitle;
      }

      let professionInsuranceAccepted = false;
      // let professionInsuranceList = [];

      // if (item.professionDepartmentsList && item.professionDepartmentsList.length > 0) {
      //   for (const profDept of item.professionDepartmentsList) {
      //     if (profDept.establishmentInfo && profDept.establishmentInfo.insuranceList) {
      //       // const establishmentInsurances = profDept.establishmentInfo.insuranceList;
      //       // if (establishmentInsurances.length > 0) {
      //       //   professionInsuranceAccepted = true;
      //       //   // establishmentInsurances.forEach(insEst => {
      //       //   //   if (insEst.insuranceInfo && !professionInsuranceList.find(ins => ins.id === insEst.insuranceInfo.id)) {
      //       //   //     professionInsuranceList.push({
      //       //   //       id: insEst.insuranceInfo.id,
      //       //   //       name: insEst.insuranceInfo.name,
      //       //   //       logo: insEst.insuranceInfo.logo,
      //       //   //       establishment_id: profDept.establishmentInfo.id,
      //       //   //       establishment_name: profDept.establishmentInfo.name
      //       //   //     });
      //       //   //   }
      //       //   // });
      //       // }
      //     }
      //   }
      // }

      // item.dataValues.insuranceAccepted = professionInsuranceAccepted;
      // item.dataValues.acceptedInsurances = professionInsuranceList;
      // item.dataValues.insuranceCount = professionInsuranceList.length;

      item.dataValues.establishmentsList = item.professionDepartmentsList || [];
      if (item.professionDepartmentsList && item.professionDepartmentsList.length > 0) {
        item.dataValues.establishmentInfo = item.professionDepartmentsList[0].establishmentInfo || null;
      }

      if (hasLocation && item.dataValues.distance !== undefined) {
        item.dataValues.distanceKm = `${item.dataValues.distance} km`;
      } else {
        item.dataValues.distance = '10 km';
        item.dataValues.distanceKm = '10 km';
      }

      try {
        const practiceLocations = await this.getDoctorPracticeLocations(item.id);
        item.dataValues.practiceLocations = practiceLocations;
      } catch (error) {
        console.error(`Error getting practice locations for professional ${item.id}:`, error);
        item.dataValues.practiceLocations = [];
      }
    }

    return dataParse(result);
  }

  async getSpecialtiesForType(type) {
    try {
      const response = await database.Specialities.findAll({
        attributes: [
          'id',
          'name',
          'icon',
          [
            database.Sequelize.literal(`(
              SELECT COUNT(DISTINCT ps.proffession_id)
              FROM professions_specialities ps
              JOIN professions_departments pd ON ps.proffession_id = pd.proffession_id
              JOIN establishment_specialities es ON es.establishment_id = pd.establishment_id AND es.speciality_id = Specialities.id
              JOIN establishments e ON pd.establishment_id = e.id
              JOIN establishment_types et ON e.establishment_type = et.id
              WHERE ps.speciality_id = Specialities.id
              AND et.name = '${type}'
            )`),
            'doctorsCount'
          ]
        ],
        where: {
          id: {
            [Op.in]: database.Sequelize.literal(`(
              SELECT DISTINCT speciality_id 
              FROM establishment_specialities es 
              JOIN establishments e ON es.establishment_id = e.id 
              JOIN establishment_types et ON e.establishment_type = et.id 
              WHERE et.name = '${type}'
            )`)
          }
        },
        having: {
          doctorsCount: {
            [Op.gt]: 0
          }
        },
        order: [['name', 'ASC']]
      });
      return dataParse(response);
    } catch (error) {
      console.log('error', error);
      return [];
    }
  }

  async getProfessionalsAdvanced({
    available,
    search_text,
    gender,
    language_id,
    category_id,
    available_today,
    // insurance_id,
    slot,
    facility_id,
    establishment_id,
    acceptsInsurance,
    healineVerified,
    recommended,
    topRated,
    onlyOnline = false,
    profession_id
  }) {
    // Robust string sanitizer to ensure UTF-8 safe JSON
    const sanitizeString = (value) => {
      if (value == null) return value;
      if (Buffer.isBuffer(value)) return value.toString('utf8');
      if (typeof value !== 'string') return String(value);
      const noLoneSurrogates = value.replace(/[\uD800-\uDFFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
      const normalized = noLoneSurrogates.normalize('NFC');
      // Map common Unicode punctuation and strip zero-width/soft hyphen/control
      const mapped = normalized
        // Dashes: figure/en/em/minus → hyphen
        .replace(/[\u2012\u2013\u2014\u2015\u2212]/g, '-')
        // Quotes to ASCII
        .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
        .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
        // Ellipsis
        .replace(/[\u2026]/g, '...')
        // Bullet/long dash like chars
        .replace(/[\u2022\u2043]/g, '-')
        // Soft hyphen and zero-width spaces
        .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, '')
        // Legacy CP1252 control range often used for punctuation; drop
        .replace(/[\u0080-\u009F]/g, '');
      return mapped.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
    };
    // Generate a unique cache key based on input parameters
    // const cacheKey = `getProfessionalsAdvanced_${JSON.stringify({
    //   available,
    //   search_text,
    //   gender,
    //   language_id,
    //   category_id,
    //   available_today,
    //   insurance_id,
    //   slot,
    //   facility_id,
    //   establishment_id,
    //   acceptsInsurance,
    //   healineVerified,
    //   recommended,
    //   topRated,
    //   onlyOnline,
    //   profession_id
    // })}`;

    // // Check cache for existing data
    // const cachedData = cache.get(cacheKey);
    // if (cachedData) {
    //   console.log(`Cache hit for key: ${cacheKey}`);
    //   return cachedData;
    // }

    // Proceed with original logic if cache miss
    const Profession = database.Profession;
    const ProfessionLanguage = database.ProfessionLanguage;
    const ProfessionSpeciality = database.ProfessionSpeciality;
    const ProfessionWorkingHours = database.profession_working_hours;
    const ProfessionDepartment = database.ProfessionDepartment;
    // const InsuranceEstablishment = database.InsuranceEstablishment;
    const EstablishmentFacilities = database.EstablishmentFacilities;

    const where = {
      deleted_at: null,
      active_status: 1
    };
    if (profession_id) {
      where.id = profession_id;
    }
    healineVerified = (healineVerified === true || healineVerified === 'true');
    recommended = (recommended === true || recommended === 'true');
    topRated = (topRated === true || topRated === 'true');

    if (healineVerified) {
      where.healineVerified = true;
    }
    if (recommended) {
      where.recommended = true;
    }
    if (topRated) {
      where.topRated = true;
    }

    if (available !== undefined) where.available = available === '1';

    if (search_text) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search_text}%` } },
        { last_name: { [Op.like]: `%${search_text}%` } }
      ];
    }

    const genderKeywordToSpecialties = {
      women: ['gynecology', 'obstetrics and gynecology', 'female'],
      kids: ['pediatrics', 'neonatology', 'child', 'children'],
      men: ['urology', 'andrology', 'male']
    };

    let specialtyFilters = [];
    if (gender && genderKeywordToSpecialties[gender.toLowerCase()]) {
      const mappedKeywords = genderKeywordToSpecialties[gender.toLowerCase()];
      const allSpecialties = await database.Specialities.findAll({
        where: {
          [Op.and]: [
            { deleted_at: null },
            {
              [Op.or]: mappedKeywords.map(kw => ({
                name: {
                  [Op.like]: `%${kw}%`
                }
              }))
            }
          ]
        },
        attributes: ['id']
      });
      specialtyFilters = allSpecialties.map(s => s.id);
    }

    // if (acceptsInsurance === true) {
    //   const insuranceEstablishments = await InsuranceEstablishment.findAll({
    //     attributes: ['establishment_id'],
    //     group: ['establishment_id']
    //   });

    //   const establishmentIds = insuranceEstablishments.map(e => e.establishment_id);

    //   if (establishmentIds.length > 0) {
    //     const professionDepartments = await ProfessionDepartment.findAll({
    //       where: { establishment_id: establishmentIds },
    //       attributes: ['profession_id'],
    //       group: ['profession_id']
    //     });

    //     if (onlyOnline === true) {
    //       where.online_consultation = false;
    //     }

    //     const professionIds = professionDepartments.map(pd => pd.profession_id);
    //     if (professionIds.length > 0) {
    //       where.id = professionIds;
    //     } else {
    //       return dataParse({ rows: [], count: 0 });
    //     }
    //   } else {
    //     return dataParse({ rows: [], count: 0 });
    //   }
    // }

    // if (insurance_id) {
    //   const insuranceEstablishments = await InsuranceEstablishment.findAll({
    //     where: { insurance_id },
    //     attributes: ['establishment_id']
    //   });
    //   const establishmentIds = insuranceEstablishments.map(e => e.establishment_id);
    //   if (establishmentIds.length > 0) {
    //     const professionDepartments = await ProfessionDepartment.findAll({
    //       where: { establishment_id: establishmentIds },
    //       attributes: ['profession_id']
    //     });
    //     const professionIds = professionDepartments.map(pd => pd.profession_id);
    //     if (professionIds.length > 0) {
    //       where.id = professionIds;
    //     } else {
    //       return dataParse({ rows: [], count: 0 });
    //     }
    //   } else {
    //     return dataParse({ rows: [], count: 0 });
    //   }
    // }

    if (facility_id) {
      const facilityEstablishments = await EstablishmentFacilities.findAll({
        where: { facility_id },
        attributes: ['establishment_id']
      });
      const establishmentIds = facilityEstablishments.map(e => e.establishment_id);
      if (establishmentIds.length > 0) {
        const professionDepartments = await ProfessionDepartment.findAll({
          where: { establishment_id: establishmentIds },
          attributes: ['profession_id']
        });
        const professionIds = professionDepartments.map(pd => pd.profession_id);
        if (professionIds.length > 0) {
          where.id = professionIds;
        } else {
          return dataParse({ rows: [], count: 0 });
        }
      } else {
        return dataParse({ rows: [], count: 0 });
      }
    }

    if (establishment_id) {
      const professionDepartments = await ProfessionDepartment.findAll({
        where: { establishment_id },
        attributes: ['profession_id']
      });
      const professionIds = professionDepartments.map(pd => pd.profession_id);
      if (professionIds.length > 0) {
        where.id = professionIds;
      } else {
        return dataParse({ rows: [], count: 0 });
      }
    }

    let slotWhere = undefined;
    if (slot) {
      if (slot === 'morning') {
        slotWhere = {
          start_time: { [Op.lte]: '12:00:00' },
          end_time: { [Op.gte]: '06:00:00' },
          is_day_off: false
        };
      } else if (slot === 'afternoon') {
        slotWhere = {
          start_time: { [Op.lte]: '17:00:00' },
          end_time: { [Op.gte]: '12:00:00' },
          is_day_off: false
        };
      } else if (slot === 'evening') {
        slotWhere = {
          start_time: { [Op.lte]: '21:00:00' },
          end_time: { [Op.gte]: '17:00:00' },
          is_day_off: false
        };
      }
    }

    const include = [];

    if (language_id) {
      include.push({
        model: ProfessionLanguage,
        as: 'languagesList',
        required: true,
        where: { language_id },
        attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] },
        include: {
          model: database.Language,
          as: 'languageInfo',
          attributes: ['id', 'language']
        }
      });
    } else {
      include.push({
        model: ProfessionLanguage,
        as: 'languagesList',
        attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] },
        include: {
          model: database.Language,
          as: 'languageInfo',
          attributes: ['id', 'language']
        }
      });
    }

    if (category_id || specialtyFilters.length > 0) {
      const specialtyWhere = {};
      if (category_id && specialtyFilters.length > 0) {
        specialtyWhere[Op.or] = [
          { speciality_id: category_id },
          { speciality_id: specialtyFilters }
        ];
      } else if (category_id) {
        specialtyWhere.speciality_id = category_id;
      } else if (specialtyFilters.length > 0) {
        specialtyWhere.speciality_id = specialtyFilters;
      }

      include.push({
        model: ProfessionSpeciality,
        as: 'specialitiesList',
        required: true,
        attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] },
        where: specialtyWhere,
        include: {
          model: database.Specialities,
          as: 'specialityInfo',
          attributes: ['id', 'name']
        }
      });
    } else {
      include.push({
        model: ProfessionSpeciality,
        as: 'specialitiesList',
        attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] },
        include: {
          model: database.Specialities,
          as: 'specialityInfo',
          attributes: ['id', 'name']
        }
      });
    }

    if (gender && !specialtyFilters.length) {
      where.gender = gender;
    }

    if (available_today === '1' || slotWhere) {
      const today = moment().day();
      include.push({
        model: ProfessionWorkingHours,
        as: 'working_hours',
        required: true,
        where: {
          day_of_week: today,
          ...(slotWhere || { is_day_off: false })
        },
        attributes: ['day_of_week', 'start_time', 'end_time', 'is_day_off']
      });
    } else {
      include.push({
        model: ProfessionWorkingHours,
        as: 'working_hours',
        attributes: ['day_of_week', 'start_time', 'end_time', 'is_day_off']
      });
    }

    include.push({
      model: database.Nationalities,
      as: 'nationalitiesInfo',
      attributes: ['id', 'name', 'icon']
    });

    include.push({
      model: database.ProfessionType,
      as: 'professionTypeInfo',
      attributes: ['id', 'name']
    });

    include.push({
      model: ProfessionDepartment,
      as: 'professionDepartmentsList',
      attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] },
      include: {
        model: database.Establishment,
        as: 'establishmentInfo',
        attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] },
        include: [
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
            model: database.EstablishmentType,
            as: 'establishmentTypeInfo',
            attributes: ['id', 'name']
          },
          // {
          //   model: database.InsuranceEstablishment,
          //   as: 'insuranceList',
          //   attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] },
          //   required: false,
          //   include: {
          //     model: database.Insurance,
          //     as: 'insuranceInfo',
          //     attributes: ['id', 'name', 'logo']
          //   }
          // }
        ]
      }
    });

    const attributes = { exclude: ['created_at', 'updated_at', 'deleted_at'] };

    const result = await Profession.findAndCountAll({
      where,
      include,
      attributes,
      distinct: true,
      order: [['id', 'DESC']]
    });

    // Process each professional with async operations
    for (const item of result.rows) {
      item.dataValues.rating = 4.5;

      // Sanitize top-level string fields
      item.dataValues.first_name = sanitizeString(item.dataValues.first_name);
      item.dataValues.last_name = sanitizeString(item.dataValues.last_name);
      item.dataValues.specialist = sanitizeString(item.dataValues.specialist);
      item.dataValues.designation = sanitizeString(item.dataValues.designation);
      item.dataValues.educational_qualification = sanitizeString(item.dataValues.educational_qualification);
      item.dataValues.photo = sanitizeString(item.dataValues.photo);
      item.dataValues.topRatedTitle = sanitizeString(item.dataValues.topRatedTitle);

      if (!item.dataValues.topRated) {
        delete item.dataValues.topRatedTitle;
      }

      let professionInsuranceAccepted = false;
      // let professionInsuranceList = [];

      if (item.professionDepartmentsList && item.professionDepartmentsList.length > 0) {
        for (const profDept of item.professionDepartmentsList) {
          // Sanitize establishment and nested info
          if (profDept.establishmentInfo) {
            profDept.establishmentInfo.name = sanitizeString(profDept.establishmentInfo.name);
            if (profDept.establishmentInfo.cityInfo) {
              profDept.establishmentInfo.cityInfo.name = sanitizeString(profDept.establishmentInfo.cityInfo.name);
            }
            if (profDept.establishmentInfo.zoneInfo) {
              profDept.establishmentInfo.zoneInfo.name = sanitizeString(profDept.establishmentInfo.zoneInfo.name);
            }
            if (profDept.establishmentInfo.establishmentTypeInfo) {
              profDept.establishmentInfo.establishmentTypeInfo.name = sanitizeString(profDept.establishmentInfo.establishmentTypeInfo.name);
            }
          }
          // if (profDept.establishmentInfo && profDept.establishmentInfo.insuranceList) {
          //   const establishmentInsurances = profDept.establishmentInfo.insuranceList;
          //   if (establishmentInsurances.length > 0) {
          //     professionInsuranceAccepted = true;
          //     establishmentInsurances.forEach(insEst => {
          //       if (insEst.insuranceInfo && !professionInsuranceList.find(ins => ins.id === insEst.insuranceInfo.id)) {
          //         professionInsuranceList.push({
          //           id: insEst.insuranceInfo.id,
          //           name: sanitizeString(insEst.insuranceInfo.name),
          //           logo: sanitizeString(insEst.insuranceInfo.logo),
          //           establishment_id: profDept.establishmentInfo.id,
          //           establishment_name: sanitizeString(profDept.establishmentInfo.name)
          //         });
          //       }
          //     });
          //   }
          // }
        }
      }

      // item.dataValues.insuranceAccepted = professionInsuranceAccepted;
      // item.dataValues.acceptedInsurances = professionInsuranceList;
      // item.dataValues.insuranceCount = professionInsuranceList.length;

      item.dataValues.establishmentsList = item.professionDepartmentsList || [];
      if (item.professionDepartmentsList && item.professionDepartmentsList.length > 0) {
        item.dataValues.establishmentInfo = item.professionDepartmentsList[0].establishmentInfo || null;
      }

      // Sanitize nested simple info blocks
      if (item.dataValues.nationalitiesInfo) {
        item.dataValues.nationalitiesInfo.name = sanitizeString(item.dataValues.nationalitiesInfo.name);
      }
      if (item.dataValues.professionTypeInfo) {
        item.dataValues.professionTypeInfo.name = sanitizeString(item.dataValues.professionTypeInfo.name);
      }

      if (item.dataValues.languagesList && Array.isArray(item.dataValues.languagesList)) {
        for (const lang of item.dataValues.languagesList) {
          if (lang.languageInfo) {
            lang.languageInfo.language = sanitizeString(lang.languageInfo.language);
          }
        }
      }

      if (item.dataValues.specialitiesList && Array.isArray(item.dataValues.specialitiesList)) {
        for (const spec of item.dataValues.specialitiesList) {
          if (spec.specialityInfo) {
            spec.specialityInfo.name = sanitizeString(spec.specialityInfo.name);
          }
        }

        // ADD THIS BLOCK HERE:
        const specialistNames = item.dataValues.specialitiesList
          .map(spec => spec.specialityInfo?.name)
          .filter(Boolean)
          .join(', ');

        item.dataValues.specialist = sanitizeString(item.dataValues.specialist);
      }

      try {
        const practiceLocations = await this.getDoctorPracticeLocations(item.id);
        // Filter practiceLocations to exclude created_at, updated_at, deleted_at
        item.dataValues.practiceLocations = practiceLocations.map(location => {
          const { created_at, updated_at, deleted_at, ...rest } = location;
          return rest;
        });
      } catch (error) {
        console.error(`Error getting practice locations for professional ${item.id}:`, error);
        item.dataValues.practiceLocations = [];
      }
    }

    // Store result in cache
    const parsedResult = dataParse(result);
    // cache.set(cacheKey, parsedResult);
    // console.log(`Cache set for key: ${cacheKey}`);

    return parsedResult;
  }

  async getEstablishment({
    speciality_id,
    establishment_type,
    // insurance_id = 0,
    service_id,
    // insurance_plan_id,
    acceptsInsurance = false,
    healineVerified = false,
    recommended = false,
    topRated = false,
    isOpenNow = false,
    searchText = '',
    image_type = null,
    establishment_id = null
  }) {
    // Generate a unique cache key based on input parameters
    // const cacheKey = `getEstablishment_${JSON.stringify({
    //   speciality_id,
    //   establishment_type,
    //   insurance_id,
    //   service_id,
    //   insurance_plan_id,
    //   acceptsInsurance,
    //   healineVerified,
    //   recommended,
    //   topRated,
    //   isOpenNow,
    //   searchText,
    //   image_type,
    //   establishment_id
    // })}`;

    // // Check cache for existing data
    // const cachedData = cache.get(cacheKey);
    // if (cachedData) {
    //   console.log(`Cache hit for key: ${cacheKey}`);
    //   return cachedData;
    // }

    // Proceed with original logic if cache miss
    const { Op, fn, literal } = database.Sequelize;

    // Early return for single establishment
    if (establishment_id) {
      return await this.getSingleEstablishment(establishment_id, image_type);
    }

    // Sanitize string function (robust UTF-8 safe)
    const sanitizeString = (value) => {
      if (value == null) return value;
      if (Buffer.isBuffer(value)) return value.toString('utf8');
      if (typeof value !== 'string') return String(value);
      const noLoneSurrogates = value.replace(/[\uD800-\uDFFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
      const normalized = noLoneSurrogates.normalize('NFC');
      const mapped = normalized
        .replace(/[\u2012\u2013\u2014\u2015\u2212]/g, '-')
        .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
        .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
        .replace(/[\u2026]/g, '...')
        .replace(/[\u2022\u2043]/g, '-')
        .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, '')
        .replace(/[\u0080-\u009F]/g, '');
      return mapped.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
    };

    // Build where clauses
    // const insuranceWhereClause = {};
    // if (insurance_id && insurance_id > 0) {
    //   insuranceWhereClause.insurance_id = insurance_id;
    // }
    // if (insurance_plan_id && insurance_plan_id > 0) {
    //   insuranceWhereClause.plan_id = insurance_plan_id;
    // }

    const specialityWhereClause = {};
    if (speciality_id) {
      specialityWhereClause.speciality_id = { [Op.in]: [speciality_id] };
    }

    const servicesWhereClause = {};
    if (service_id) {
      servicesWhereClause.service_id = { [Op.in]: [service_id] };
    }


    const estTypeWhereClause = {};
    if (establishment_type && establishment_type !== '') {
      if (Array.isArray(establishment_type)) {
        const isNumericArray = establishment_type.every(type => !isNaN(parseInt(type)));
        estTypeWhereClause[isNumericArray ? 'id' : 'name'] = {
          [Op.in]: isNumericArray ? establishment_type.map(id => parseInt(id)) : establishment_type
        };
      } else {
        estTypeWhereClause[!isNaN(parseInt(establishment_type)) ? 'id' : 'name'] =
          !isNaN(parseInt(establishment_type)) ? parseInt(establishment_type) : establishment_type;
      }
    }

    const imageWhereClause = {};
    if (image_type && (image_type === 'main' || image_type === 'gallery')) {
      imageWhereClause.image_type = image_type;
    }

    const bannerImageWhereClause = {};
    if (image_type && image_type === 'banner') {
      bannerImageWhereClause.type = image_type;
    }

    const baseWhereClause = {
      deleted_at: null,
      active_status: 1
    };
    if (healineVerified) baseWhereClause.healineVerified = true;
    if (recommended) baseWhereClause.recommended = true;
    if (topRated) baseWhereClause.topRated = true;

    if (searchText && searchText.trim() !== '') {
      const trimmedSearch = sanitizeString(searchText.trim());
      baseWhereClause[Op.or] = [
        { name: { [Op.like]: `%${trimmedSearch}%` } },
        { address: { [Op.like]: `%${trimmedSearch}%` } },
        {
          id: {
            [Op.in]: literal(
              `(SELECT establishment_id FROM EstablishmentSpeciality WHERE speciality_id IN (
                SELECT id FROM Specialities WHERE name LIKE '%${trimmedSearch}%'
              ))`
            )
          }
        }
      ];
    }

    const today = moment().day();
    const nowTimeStr = moment().format('HH:mm:ss');

    const workingHoursInclude = {
      model: database.EstablishmentWorkingHour,
      as: 'workingHoursDetails',
      // required: isOpenNow,
      attributes: ['day_of_week', 'start_time', 'end_time', 'is_day_off'],
      // where: isOpenNow
      //   ? { day_of_week: today, is_day_off: false, start_time: { [Op.lte]: nowTimeStr }, end_time: { [Op.gt]: nowTimeStr } }
      //   : { day_of_week: today },
      separate: true
    };

    const attributes = [
      'id', 'name', 'address', 'about', 'latitude', 'longitude', 'mobile_country_code',
      'contact_number', 'email', 'licence_no', 'establishment_sub_type', 'is_24_by_7_working',
      'primary_photo', 'healineVerified', 'recommended', 'expertin', 'topRated', 'topRatedTitle',
      [literal('4.5'), 'rating']
    ];

    // Single query for count and data
    const result = await database.Establishment.findAndCountAll({
      where: baseWhereClause,
      attributes,
      include: [
        { model: database.Zones, as: 'zoneInfo', attributes: ['id', 'name'], required: false },
        { model: database.Cities, as: 'cityInfo', attributes: ['id', 'name', 'zone_id'], required: false },
        {
          model: database.EstablishmentType,
          as: 'establishmentTypeInfo',
          required: !!Object.keys(estTypeWhereClause).length,
          attributes: ['id', 'name'],
          where: estTypeWhereClause
        },
        {
          model: database.EstablishmentSpeciality,
          as: 'specialitiesList',
          required: !!Object.keys(specialityWhereClause).length,
          attributes: ['id', 'establishment_id', 'speciality_id'],
          where: specialityWhereClause,
          separate: true,
          limit: 20,
          include: { model: database.Specialities, as: 'specialityInfo', attributes: ['id', 'name', 'icon'] }
        },
        {
          model: database.InsurancePlanEstablishment,
          as: 'insurancePlans',
          required: false,
          attributes: ['id', 'establishment_id', 'plan_id'],
          include: [
            {
              model: database.InsurancePlan,
              as: 'plan',
              attributes: ['id', 'name', 'annual_limit', 'area_of_cover'],
              include: [
                {
                  model: database.InsuranceNetwork,
                  as: 'network',
                  attributes: ['id', 'name'],
                  include: [
                    {
                      model: database.InsuranceCompany,
                      as: 'company',
                      attributes: ['id', 'name', 'logo_url']
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          model: database.EstablishmentService,
          as: 'servicesList',
          required: !!Object.keys(servicesWhereClause).length,
          attributes: ['id', 'establishment_id', 'service_id'],
          where: servicesWhereClause,
          separate: true,
          limit: 20,
          include: { model: database.Service, as: 'name', attributes: ['id', 'name'] }
        },
        workingHoursInclude,
        {
          model: database.ProfessionDepartment,
          as: 'professionsList',
          attributes: ['proffession_id', 'establishment_id'],
          required: false,
          separate: true,
          limit: 10,
          include: [{
            model: database.Profession,
            as: 'professionInfo',
            attributes: [
              'id', 'first_name', 'last_name', 'specialist', 'designation',
              'educational_qualification', 'photo', 'consultation_fees', 'gender',
              'healineVerified', 'recommended', 'topRated', 'topRatedTitle'
            ],
            include: [
              { model: database.ProfessionType, as: 'professionTypeInfo', attributes: ['id', 'name'] },
              { model: database.Nationalities, as: 'nationalitiesInfo', attributes: ['id', 'name'] },
              {
                model: database.ProfessionSpeciality,
                as: 'specialitiesList',
                attributes: ['speciality_id'],
                separate: true,
                limit: 5,
                include: [{ model: database.Specialities, as: 'specialityInfo', attributes: ['id', 'name'] }]
              }
            ]
          }]
        },
        {
          model: database.EstablishmentImages,
          as: 'imageList',
          required: false,
          where: imageWhereClause,
          attributes: ['id', 'establishment_id', 'image', 'image_type'],
          separate: true,
          limit: 5
        },
        {
          model: database.EstablishmentBannerImages,
          as: 'bannerImageList',
          required: false,
          where: bannerImageWhereClause,
          attributes: ['id', 'establishment_id', 'image', 'linkUrl', 'type'],
          separate: true,
          limit: 5
        },
        {
          model: database.EstablishmentFacilities,
          as: 'facilitiesList',
          attributes: ['id', 'establishment_id', 'facility_id'],
          required: false,
          separate: true,
          limit: 20,
          include: { model: database.Facilities, as: 'facilityInfo', attributes: ['id', 'name', 'icon', 'description'] }
        },
        {
          model: database.EstablishmentBrands,
          as: 'brandsList',
          attributes: ['id', 'establishment_id', 'brand_id'],
          required: false,
          separate: true,
          limit: 20,
          include: { model: database.Brands, as: 'brandInfo', attributes: ['id', 'name', 'icon', 'description'] }
        },
        {
          model: database.Department,
          as: 'departmentList',
          required: false,
          attributes: ['id', 'name'],
          separate: true
        }
      ],
      order: [['id', 'DESC']],
      subQuery: false,
      distinct: true
    });

    // Process results
    const rows = result.rows.map(est => {
      const dataValues = { ...est?.dataValues };

      // Sanitize string fields
      dataValues.name = sanitizeString(dataValues.name);
      dataValues.address = sanitizeString(dataValues.address);
      dataValues.about = sanitizeString(dataValues.about);
      dataValues.email = sanitizeString(dataValues.email);
      dataValues.primary_photo = sanitizeString(dataValues.primary_photo);
      dataValues.expertin = sanitizeString(dataValues.expertin);
      dataValues.topRatedTitle = sanitizeString(dataValues.topRatedTitle);

      // Process images
      dataValues.imageList = Array.isArray(dataValues.imageList)
        ? dataValues.imageList.map(img => ({
          ...img.dataValues,
          image: sanitizeString(img.image),
          image_type: sanitizeString(img.image_type)
        }))
        : [];

      // Process banner images
      dataValues.bannerImageList = Array.isArray(dataValues.bannerImageList)
        ? dataValues.bannerImageList.map(img => ({
          ...img.dataValues,
          image: sanitizeString(img.image),
          linkUrl: sanitizeString(img.linkUrl),
          type: sanitizeString(img.type)
        }))
        : [];

      // Process nested includes
      if (Array.isArray(dataValues.specialitiesList)) {
        dataValues.specialitiesList = dataValues.specialitiesList.map(spec => ({
          ...spec.dataValues,
          specialityInfo: spec.specialityInfo
            ? { ...spec.specialityInfo.dataValues, name: sanitizeString(spec.specialityInfo.name), icon: sanitizeString(spec.specialityInfo.icon) }
            : spec.specialityInfo
        }));
      }

      // Sanitize simple nested info blocks
      if (dataValues.zoneInfo) {
        dataValues.zoneInfo.name = sanitizeString(dataValues.zoneInfo.name);
      }
      if (dataValues.cityInfo) {
        dataValues.cityInfo.name = sanitizeString(dataValues.cityInfo.name);
      }
      if (dataValues.establishmentTypeInfo) {
        dataValues.establishmentTypeInfo.name = sanitizeString(dataValues.establishmentTypeInfo.name);
      }

      // Insurance plans
      if (Array.isArray(dataValues.insurancePlans)) {
        dataValues.insurancePlans = dataValues.insurancePlans.map(link => ({
          id: link.id,
          plan_id: link.plan_id,

          plan: link.plan ? {
            id: link.plan.id,
            name: sanitizeString(link.plan.name),
            annual_limit: sanitizeString(link.plan.annual_limit),
            area_of_cover: sanitizeString(link.plan.area_of_cover),

            network: link.plan.network ? {
              id: link.plan.network.id,
              name: sanitizeString(link.plan.network.name),

              company: link.plan.network.company ? {
                id: link.plan.network.company.id,
                name: sanitizeString(link.plan.network.company.name),
                logo_url: sanitizeString(link.plan.network.company.logo_url)
              } : null

            } : null

          } : null
        }));
      }


      if (Array.isArray(dataValues.servicesList)) {
        dataValues.servicesList = dataValues.servicesList.map(srv => ({
          ...srv.dataValues,
          name: srv.name ? { ...srv.name.dataValues, name: sanitizeString(srv.name.name) } : srv.name
        }));
      }

      if (Array.isArray(dataValues.facilitiesList)) {
        dataValues.facilitiesList = dataValues.facilitiesList.map(fac => ({
          ...fac.dataValues,
          facilityInfo: fac.facilityInfo
            ? {
              ...fac.facilityInfo.dataValues,
              name: sanitizeString(fac.facilityInfo.name),
              icon: sanitizeString(fac.facilityInfo.icon),
              description: sanitizeString(fac.facilityInfo.description)
            }
            : fac.facilityInfo
        }));
      }

      if (Array.isArray(dataValues.brandsList)) {
        dataValues.brandsList = dataValues.brandsList.map(brand => ({
          ...brand.dataValues,
          brandInfo: brand.brandInfo
            ? {
              ...brand.brandInfo.dataValues,
              name: sanitizeString(brand.brandInfo.name),
              icon: sanitizeString(brand.brandInfo.icon),
              description: sanitizeString(brand.brandInfo.description)
            }
            : brand.brandInfo
        }));
      }

      if (Array.isArray(dataValues.professionsList)) {
        dataValues.professionsList = dataValues.professionsList.map(prof => ({
          ...prof.dataValues,
          professionInfo: prof.professionInfo
            ? {
              ...prof.professionInfo.dataValues,
              first_name: sanitizeString(prof.professionInfo.first_name),
              last_name: sanitizeString(prof.professionInfo.last_name),
              specialist: sanitizeString(prof.professionInfo.specialist),
              designation: sanitizeString(prof.professionInfo.designation),
              educational_qualification: sanitizeString(prof.professionInfo.educational_qualification),
              photo: sanitizeString(prof.professionInfo.photo),
              topRatedTitle: sanitizeString(prof.professionInfo.topRatedTitle),
              professionTypeInfo: prof.professionInfo.professionTypeInfo
                ? { ...prof.professionInfo.professionTypeInfo.dataValues, name: sanitizeString(prof.professionInfo.professionTypeInfo.name) }
                : prof.professionInfo.professionTypeInfo,
              nationalitiesInfo: prof.professionInfo.nationalitiesInfo
                ? { ...prof.professionInfo.nationalitiesInfo.dataValues, name: sanitizeString(prof.professionInfo.nationalitiesInfo.name) }
                : prof.professionInfo.nationalitiesInfo,
              specialitiesList: Array.isArray(prof.professionInfo.specialitiesList)
                ? prof.professionInfo.specialitiesList.map(spec => ({
                  ...spec.dataValues,
                  specialityInfo: spec.specialityInfo
                    ? { ...spec.specialityInfo.dataValues, name: sanitizeString(spec.specialityInfo.name) }
                    : spec.specialityInfo
                }))
                : []
            }
            : prof.professionInfo
        }));
      }

      if (Array.isArray(dataValues.departmentList)) {
        dataValues.departmentList = dataValues.departmentList.map(dep => ({
          ...dep.dataValues,
          name: sanitizeString(dep.name)
        }));
      }

      // Process working hours and isOpenNow
      const todaysWh = Array.isArray(dataValues.workingHoursDetails) && dataValues.workingHoursDetails.length > 0
        ? dataValues.workingHoursDetails[0]
        : null;
      dataValues.isOpenNow = todaysWh && !todaysWh.is_day_off
        ? moment(todaysWh.start_time, 'HH:mm:ss').isSameOrBefore(moment()) &&
        moment(todaysWh.end_time, 'HH:mm:ss').isAfter(moment())
        : false;

      // Add computed fields
      dataValues.doctorsCount = Array.isArray(dataValues.professionsList) ? dataValues.professionsList.length : 0;
      // dataValues.insuranceAccepted = Array.isArray(dataValues.insuranceList) && dataValues.insuranceList.length > 0;
      // dataValues.insuranceCount = Array.isArray(dataValues.insuranceList) ? dataValues.insuranceList.length : 0;
      dataValues.filteredImagesCount = Array.isArray(dataValues.imageList) ? dataValues.imageList.length : 0;
      dataValues.bannerImagesCount = Array.isArray(dataValues.bannerImageList) ? dataValues.bannerImageList.length : 0;

      // Handle image type filtering
      if (image_type && dataValues.imageList?.length > 0) {
        dataValues.imageFilterType = sanitizeString(image_type);
      }
      if (image_type === 'banner' && dataValues.bannerImageList?.length > 0) {
        dataValues.imageFilterType = sanitizeString(image_type);
      }

      // Handle topRated title
      if (dataValues.topRated) {
        dataValues.topRatedTitle = dataValues.topRatedTitle ? sanitizeString(dataValues.topRatedTitle) : '';
      } else {
        delete dataValues.topRatedTitle;
      }

      return dataValues;
    });

    console.log(`Returned ${rows.length} establishments`);

    // Store result in cache
    const parsedResult = dataParse({ count: result.count, rows });
    // cache.set(cacheKey, parsedResult);
    // console.log(`Cache set for key: ${cacheKey}`);

    return parsedResult;
  }

}

export default new DashboardService();