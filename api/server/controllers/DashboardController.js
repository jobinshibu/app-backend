import httpStatus from 'http-status';
import APIResponse from '../utils/APIResponse.js';
import DashboardService from '../services/DashboardService.js';
import CommonService from '../services/common.js';
import { getOffset } from '../utils/helper.js';
import SearchService from '../services/search.js';
import db from "../models/index.js";
const ServiceModel = db.Service;
import { Op, Sequelize } from 'sequelize';
class DashboardController {
  async getCategoriesList(req, res) {
    try {
      const response = await DashboardService.getCategoriesList();
      
      return res
        .status(httpStatus.OK)
        .json(new APIResponse(response, 'Category list found.', httpStatus.OK));
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            [],
            'Something went wrong.',
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }

    async getFaqList(req, res) {
      try {
            const { type } = req.query;  // Get the 'type' from query parameters

        const response = await DashboardService.getFaqList(type);
        return res
          .status(httpStatus.OK)
          .json(new APIResponse(response, 'Category FAQ found.', httpStatus.OK));
      } catch (error) {
        return res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json(
            new APIResponse(
              [],
              'Something went wrong.',
              httpStatus.INTERNAL_SERVER_ERROR
            )
          );
      }
    }

    async getDemoList(req, res) {
      try {
        const response = await DashboardService.getDemoList();
        return res
          .status(httpStatus.OK)
          .json(new APIResponse(response, 'Demo found.', httpStatus.OK));
      } catch (error) {
        return res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json(
            new APIResponse(
              [],
              'Something went wrong.',
              httpStatus.INTERNAL_SERVER_ERROR
            )
          );
      }
    }

  async getServicesList(req, res) {
    try {
      const { categoryId, serviceType, search_text, id } = req.query; // Destructure query params including id
      const whereClause = {}; // Define whereClause
      if (categoryId) whereClause.categoryId = +categoryId;
      if (serviceType) whereClause.serviceType = serviceType;
      if (search_text) whereClause.name = { [Op.like]: `%${search_text}%` };
      if (id) whereClause.id = +id; // Add id filter

      const services = await ServiceModel.findAll({
        attributes: [
          'id',
          'name',
          'categoryId',
          'serviceType',
          'price',
          'discountPrice',
          'resultTime',
          'homeSampleCollection',
          'recommended',
          'image',
          'testOverview',
        ],
        where: whereClause, // Use the defined whereClause
        include: [
          { model: db.Specialities, as: 'categoryInfo', attributes: ['id', 'name', 'icon'] },
          {
            model: db.ServiceWorkingHours,
            as: 'working_hours',
            attributes: ['day_of_week', 'start_time', 'end_time', 'is_day_off'],
            required: false,
          },
          {
            model: db.EstablishmentService,
            as: 'servicesList',
            attributes: ['establishment_id'],
            required: false,
            include: [
              {
                model: db.Establishment,
                as: 'establishment',
                attributes: ['id', 'name', 'latitude', 'longitude'],
                // include: [
                //   // {
                //   //   model: db.InsuranceEstablishment,
                //   //   as: 'insuranceList',
                //   //   attributes: ['insurance_id'],
                //   //   include: [
                //   //     {
                //   //       model: db.Insurance,
                //   //       as: 'insuranceInfo',
                //   //       attributes: ['id', 'name'],
                //   //     },
                //   //   ],
                //   // },
                // ],
              },
            ],
          },
        ],
        order: [['id', 'DESC']],
      });

      const baseUrl = `${process.env.IMAGE_PATH || 'http://localhost:5710'}/services/`;
      const payload = services.map((item) => {
        const itemJson = item.toJSON();
        const hospitalDetails = itemJson.servicesList?.length
          ? itemJson.servicesList.map((es) => ({
              id: es.establishment?.id,
              name: es.establishment?.name,
              lat: es.establishment?.latitude,
              long: es.establishment?.longitude,
              // availableInsurances: es.establishment?.insuranceList?.length
              //   ? es.establishment.insuranceList.map((ins) => ({
              //       id: ins.insuranceInfo?.id,
              //       name: ins.insuranceInfo?.name,
              //     }))
              //   : [],
            }))
          : [];
        return {
          id: itemJson.id,
          name: itemJson.name,
          categoryId: itemJson.categoryId,
          serviceType: itemJson.serviceType,
          price: itemJson.price,
          discountPrice: itemJson.discountPrice,
          resultTime: itemJson.resultTime,
          homeCollection: itemJson.homeSampleCollection,
          image: itemJson.image ? baseUrl + itemJson.image : null,
          recommended: itemJson.recommended,
          testDetails: itemJson.testOverview || [],
          timeSlots: itemJson.working_hours?.map((wh) => ({
            dayOfWeek: wh.day_of_week,
            startTime: wh.start_time,
            endTime: wh.end_time,
            isDayOff: wh.is_day_off,
          })) || [],
          hospitalId: itemJson.servicesList?.length ? itemJson.servicesList[0]?.establishment_id : null,
          hospitalDetails,
          couponIds: [],
          categoryInfo: itemJson.categoryInfo,
        };
      });

      return res
        .status(httpStatus.OK)
        .json(new APIResponse(payload, 'Services fetched successfully', httpStatus.OK));
    } catch (err) {
      const errMessage = typeof err === 'string' ? err : err.message;
      console.error('getServicesList error:', err);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(new APIResponse([], 'Error fetching services: ' + errMessage, httpStatus.INTERNAL_SERVER_ERROR));
    }
  }

  async getFacilitiesList(req, res) {
    try {
      const response = await DashboardService.getFacilitiesList();
      return res
        .status(httpStatus.OK)
        .json(
          new APIResponse(response, 'Facilities list found.', httpStatus.OK)
        );
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            [],
            'Something went wrong.',
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }

  async getEstablishmentTypesList(req, res) {
    try {
      const response = await DashboardService.getEstablishmentTypesList();
      return res
        .status(httpStatus.OK)
        .json(
          new APIResponse(
            response,
            'Establishment types list found.',
            httpStatus.OK
          )
        );
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            [],
            'Something went wrong.',
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }

  async getBannersList(req, res) {
    try {
      const response = await DashboardService.getBannersList();
      if (response && response.length > 0) {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(response, 'Banners list found.', httpStatus.OK)
          );
      } else {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(
            new APIResponse(
              response,
              'Banners not found.',
              httpStatus.NOT_FOUND
            )
          );
      }
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            [],
            'Something went wrong.',
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }

  async getHospitalsList(req, res) {
    try {
      const response = await DashboardService.getHospitalsList();
      if (response && response.length > 0) {
        for (const item of response) {
          item.distance = '10 km';
          item.rating = 4.5;
        }
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(response, 'Hospitals list found.', httpStatus.OK)
          );
      } else {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(
            new APIResponse(
              [],
              'No hospitals found.',
              httpStatus.NOT_FOUND
            )
          );
      }
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            [],
            'Something went wrong.',
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }

  async getPharmacyList(req, res) {
    try {
      const response = await DashboardService.getPharmacyList();
      if (response && response.length > 0) {
        for (const item of response) {
          item.distance = '10 km';
          item.rating = 4.5;
        }
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(response, 'Pharmacy list found.', httpStatus.OK)
          );
      } else {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(
            new APIResponse(
              [],
              'No pharmacies found.',
              httpStatus.NOT_FOUND
            )
          );
      }
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            [],
            'Something went wrong.',
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }

async categoryEstablishmentSearchListNew(req, res) {
  try {
    const {
      latitude,
      longitude,
      category_id,
      type,
      insurance_id,
      service_id,
      page_no = 1,
      items_per_page = 10,
      insurance_plan_id,
      topRated,
      acceptsInsurance,
      healineVerified,
      recommended,
      isOpenNow,
      searchText: searchTextParam,
      search_text,
      establishment_type,
      image_type,
      establishment_id
    } = req.query;

    let parsedEstablishmentType = establishment_type || type;
    if (parsedEstablishmentType && typeof parsedEstablishmentType === 'string' && parsedEstablishmentType.includes(',')) {
      parsedEstablishmentType = parsedEstablishmentType.split(',').map(id => id.trim());
    }

    const searchText = (searchTextParam ?? search_text ?? '').toString();
    const offset = getOffset(+page_no, +items_per_page);
    const specialityId = req.query.speciality_id ?? category_id;
    
    // Call with ALL 17 params
    const response = await DashboardService.getEstablishmentSearchListNew(
      specialityId,
      parsedEstablishmentType,
      // insurance_id,
      service_id,
      latitude,
      longitude,
      offset,
      +items_per_page,
      insurance_plan_id,
      // acceptsInsurance === 'true',
      healineVerified === 'true',
      recommended === 'true',
      topRated === 'true',
      isOpenNow === 'true',
      searchText,
      image_type,
      establishment_id
    );

    if (establishment_id) {
      if (response.rows.length > 0) {
        const establishment = response.rows[0];
        
        // Get practice locations
        const practiceLocations = await DashboardService.getDoctorPracticeLocations(establishment_id);
        if (practiceLocations && practiceLocations.length > 0) {
          for (const item of practiceLocations) {
            item.distance = '10 km';
            item.rating = 4.5;
          }
        }
        establishment.practiceLocations = practiceLocations;

        // Set ratings for professions
        if (establishment.professionsList && establishment.professionsList.length > 0) {
          for (const item of establishment.professionsList) {
            if (item.professionInfo) {
              item.professionInfo.rating = 4.5;
            }
          }
        }

        return res.status(httpStatus.OK).json(
          new APIResponse({ rows: [establishment], totalRows: 1 }, 'Data found.', httpStatus.OK)
        );
      } else {
        return res.status(httpStatus.NOT_FOUND).json(
          new APIResponse({ rows: [], totalRows: 0 }, 'Data not found.', httpStatus.NOT_FOUND)
        );
      }
    }

    // List response
    if (response.rows.length > 0) {
      return res.status(httpStatus.OK).json(
        new APIResponse({ rows: response.rows, totalRows: response.count }, 'Data found.', httpStatus.OK)
      );
    } else {
      return res.status(httpStatus.NOT_FOUND).json(
        new APIResponse({ rows: [], totalRows: response.count }, 'Data not found.', httpStatus.NOT_FOUND)
      );
    }
  } catch (error) {
    console.error('categoryEstablishmentSearchListNew error:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
      new APIResponse([], 'Something went wrong.', httpStatus.INTERNAL_SERVER_ERROR)
    );
  }
}

  async categoryProfessionSearchList(req, res) {
    try {
      const { latitude, longitude, category_id, type } = req.query;
      console.log('hello');
      // return;
      const response = await DashboardService.getProfessionSearchList(
        category_id,
        type
      );
      if (response && response.length > 0) {
        for (const item of response) {
          const practiceLocations =
            await DashboardService.getDoctorPracticeLocations(item.id);
          item.practiceLocations = practiceLocations;
          item.distance = '10 km';
          item.rating = 4.5;
        }
        return res
          .status(httpStatus.OK)
          .json(new APIResponse(response, 'Data found.', httpStatus.OK));
      } else {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(
            new APIResponse(response, 'Data not found.', httpStatus.NOT_FOUND)
          );
      }
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            [],
            'Something went wrong.',
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }
  async getProfessionsDetail(req, res) {
    try {
      // const id = req.query.id;
      const { latitude, longitude, profession_id } = req.query;
      var id = profession_id;
      const response = await DashboardService.getProfessionsDetail(id);
      if (response) {
        response.distance = '10 km';
        response.rating = 4.5;

        const practiceLocations =
          await DashboardService.getDoctorPracticeLocations(id);
        console.log('practiceLocations', practiceLocations);
        for (const item of practiceLocations) {
          item.distance = '10 km';
          item.rating = 4.5;
        }
        response.practiceLocations = practiceLocations;
        var newR = response;
        return res
          .status(httpStatus.OK)
          .json(new APIResponse(response, 'Data found.', httpStatus.OK));
      } else {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(
            new APIResponse(response, 'Data not found.', httpStatus.NOT_FOUND)
          );
      }
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            [],
            'Something went wrong.',
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }
  async getEstablishmentDetail(req, res) {
    try {
      // const id = req.params.id;
      const { latitude, longitude, establishment_id } = req.query;
      const id = establishment_id;
      const response = await DashboardService.getEstablishmentDetail(id);
      if (response) {
        response.distance = '10 km';
        response.rating = 4.5;

        const practiceLocations =
          await DashboardService.getDoctorPracticeLocations(id);
        console.log('practiceLocations', practiceLocations);
        for (const item of practiceLocations) {
          item.distance = '10 km';
          item.rating = 4.5;
        }
        response.practiceLocations = practiceLocations;

        for (const item of response.professionsList) {
          if (item.professionInfo) {
            item.professionInfo.rating = '10 km';
          }
        }

        var newR = response;
        return res
          .status(httpStatus.OK)
          .json(new APIResponse(response, 'Data found.', httpStatus.OK));
      } else {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(
            new APIResponse(response, 'Data not found.', httpStatus.NOT_FOUND)
          );
      }
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            [],
            'Something went wrong.',
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }


  async saveRemoveBookMark(req, res) {
    try {
      const { user_id, establishment_id, is_save } = req.body;
      if (is_save && is_save == 1) {
        const isBookmarkAlreadyExist =
          await CommonService.getSingleRecordByCondition('Bookmark', {
            user_id: user_id,
            establishment_id
          });

        if (isBookmarkAlreadyExist) {
          return res
            .status(httpStatus.BAD_REQUEST)
            .json(
              new APIResponse(
                {},
                'Sorry! Bookmark already added.',
                httpStatus.BAD_REQUEST
              )
            );
        } else {
          var result = await CommonService.create('Bookmark', {
            user_id: user_id,
            establishment_id
          });
          return res
            .status(httpStatus.OK)
            .json(
              new APIResponse(
                result,
                'Bookmark added successfully.',
                httpStatus.OK
              )
            );
        }
      } else {
        var response = await CommonService.deleteByCondition('Bookmark', {
          user_id: user_id,
          establishment_id
        });
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              response,
              'Bookmark removed successfully.',
              httpStatus.OK
            )
          );
      }
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            [],
            'Something went wrong.',
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }
  async getBookmarkList(req, res) {
    try {
      var user_id = req.query.user_id;
      const response = await DashboardService.getUserBookmarkList(user_id);
      if (response && response.length > 0) {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(response, 'Bookmark list found.', httpStatus.OK)
          );
      } else {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(
            new APIResponse(
              response,
              'Bookmarks not found.',
              httpStatus.NOT_FOUND
            )
          );
      }
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            [],
            'Something went wrong.',
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }

  async searchProfessionals(req, res) {
    try {
      const {
        latitude,
        longitude,
        available,
        search_text,
        gender,
        language_id,
        category_id,
        page_no = 1,
        items_per_page = 10,
        available_today,
        // insurance_id,
        establishment_id,  // Add this line if not already present
        slot,
        facility_id,
        acceptsInsurance,
        healineVerified,
        recommended,
        topRated,
        onlyOnline,
        profession_id // Add profession_id to destructured query params
      } = req.query;

      const offset = getOffset(+page_no, +items_per_page);
      // const offset = 0;

      const response = await DashboardService.searchProfessionalsAdvanced({
        latitude,
        longitude,
        available,
        search_text,
        gender,
        language_id,
        category_id,
        offset,
        limit: +items_per_page,
        // limit: null,
        available_today,
        // insurance_id,
        slot,
        facility_id,
        establishment_id,  // Add this line
        acceptsInsurance: acceptsInsurance === 'true' ? true : false,
        healineVerified: healineVerified === 'true' ? true : false,
        recommended: recommended === 'true' ? true : false,
        topRated: topRated === 'true' ? true : false,
        onlyOnline: onlyOnline === 'true',
        profession_id // Pass profession_id to the service
      });

      const payload = new APIResponse(
        {
          rows: response.rows,
          totalRows: response.count
        },
        'Professionals list found.',
        httpStatus.OK
      );
      try {
        const body = JSON.stringify(payload);
        const crypto = await import('crypto');
        const hash = crypto.createHash('sha256').update(body).digest('hex');
        res.set('X-Body-Checksum-SHA256', hash);
        return res.status(httpStatus.OK).send(body);
      } catch (e) {
        return res.status(httpStatus.OK).json(payload);
      }
    } catch (error) {
      console.error('Error searching professionals:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        new APIResponse([], 'Something went wrong.', httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }

  async search(req, res) {
    try {
      const { search_text, type, page_no = 1, items_per_page = 10 } = req.query;
      if (!search_text) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(new APIResponse({}, 'Search text is required.', httpStatus.BAD_REQUEST));
      }

      const offset = getOffset(+page_no, +items_per_page);
      const response = await SearchService.searchEntities(search_text, type, items_per_page, offset);

      if (response.rows.length > 0) {
        return res
          .status(httpStatus.OK)
          .json(new APIResponse(response, 'Search results found.', httpStatus.OK));
      } else {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(new APIResponse(response, 'No results found.', httpStatus.NOT_FOUND));
      }
    } catch (error) {
      console.error('Error in search:', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(new APIResponse([], 'Something went wrong.', httpStatus.INTERNAL_SERVER_ERROR));
    }
  }
  async getSearchResultDetail(req, res) {
    try {
      const { type, reference_id } = req.query;

      if (!type || !reference_id) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(new APIResponse({}, 'Type and reference_id are required.', httpStatus.BAD_REQUEST));
      }

      let response;

      switch (type) {
        case 'doctor':
          // Use existing profession detail method
          response = await DashboardService.getProfessionsDetail(reference_id);
          if (response) {
            response.distance = '10 km';
            response.rating = 4.5;
            const practiceLocations = await DashboardService.getDoctorPracticeLocations(reference_id);
            for (const item of practiceLocations) {
              item.distance = '10 km';
              item.rating = 4.5;
            }
            response.practiceLocations = practiceLocations;
          }
          break;

        case 'hospital':
          const detailResponse = await DashboardService.getEstablishmentSearchListNew(
            null, null, null, null, null, null, 0, 1, null, false, false, '', null, reference_id
          );
          response = detailResponse.rows[0] || null;
          if (response) {
            response.distance = '10 km';
            response.rating = 4.5;
            const practiceLocations = await DashboardService.getDoctorPracticeLocations(reference_id);
            if (practiceLocations && practiceLocations.length > 0) {
              for (const item of practiceLocations) {
                item.distance = '10 km';
                item.rating = 4.5;
                // Rewrite images for practice locations (if they include images)
                if (item.primary_photo) {
                  item.primary_photo = item.primary_photo; // Already rewritten by getter
                }
                if (item.imageList && item.imageList.length > 0) {
                  item.imageList = item.imageList.map(img => ({
                    ...img,
                    image: img.image ? `${BASE_URL}/establishment/${img.image}` : null
                  }));
                }
              }
            }
            response.practiceLocations = practiceLocations;

            if (response.professionsList && response.professionsList.length > 0) {
              for (const item of response.professionsList) {
                if (item.professionInfo) {
                  item.professionInfo.rating = 4.5; // Fixed from '10 km'
                }
              }
            }
          }
          break;

        case 'service':
          // Get service details directly here
          try {
            const service = await ServiceModel.findByPk(reference_id, {
              include: [
                {
                  model: db.Specialities,
                  as: 'categoryInfo',
                  attributes: ['id', 'name', 'icon']
                }
              ]
            });

            if (service) {
              const baseUrl = `${process.env.IMAGE_PATH || 'http://localhost:5710'}/services/`;
              response = {
                ...service.toJSON(),
                image: service.image ? baseUrl + service.image : null
              };
            }
          } catch (error) {
            console.error('Error getting service detail:', error);
            throw error;
          }
          break;
        
        case 'package':
          try {
            const pkg = await db.Package.findByPk(reference_id, {
              include: [
                {
                  model: db.PackageCategory,
                  as: 'category',
                  attributes: ['id', 'name', 'description', 'icon']
                },
                {
                  model: db.Biomarker,
                  as: 'biomarkers',
                  through: { attributes: [] },
                  include: [
                    {
                      model: db.BiomarkerGroup,
                      as: 'groups',
                      attributes: ['id', 'name']
                    }
                  ]
                },
                {
                  model: db.PackageAddon,
                  as: 'addonDetails',
                  attributes: ['id', 'biomarker_id', 'addon_package_id', 'recommended'],
                  include: [
                    {
                      model: db.Biomarker,
                      as: 'biomarkerInfo',
                      attributes: ['id', 'name']
                    },
                    {
                      model: db.Package,
                      as: 'addonPackageInfo',
                      attributes: ['id', 'name']
                    }
                  ]
                }
              ]
            });

            if (!pkg) break;

            // Group biomarkers by group
            const groupedBiomarkers = {};
            pkg.biomarkers?.forEach(bm => {
              const groupName = bm.groups?.name || 'Others';
              if (!groupedBiomarkers[groupName]) groupedBiomarkers[groupName] = [];
              groupedBiomarkers[groupName].push({
                id: bm.id,
                name: bm.name
              });
            });

            response = {
              id: pkg.id,
              name: pkg.name,
              sub_title: pkg.sub_title || '',
              description: pkg.description || '',
              base_price: pkg.base_price,
              selling_price: pkg.selling_price,
              strike_price: pkg.strike_price,
              discount_text: pkg.discount_text,
              image: pkg.image ? `${process.env.IMAGE_PATH}/packages/${pkg.image}` : null,
              category: pkg.category ? {
                id: pkg.category.id,
                name: pkg.category.name,
                description: pkg.category.description,
                icon: pkg.category.icon  // ← already full URL from getter
              } : null,
              total_biomarkers: pkg.biomarkers?.length || 0,
              biomarkers: Object.entries(groupedBiomarkers).map(([group, tests]) => ({
                group_name: group,
                tests
              })),
              addons: (pkg.addonsList || []).map(addon => ({
                id: addon.id,
                name: addon.biomarkerInfo?.name || addon.addonPackageInfo?.name || 'Add-on',
                price: addon.price || 0,
                recommended: addon.recommended
              }))
            };

          } catch (error) {
            console.error('Error fetching package:', error);
            throw error;
          }
          break;

        case 'package category':
          try {
            const category = await db.PackageCategory.findByPk(reference_id, {
              include: [
                {
                  model: db.Package,
                  as: 'packages',
                  attributes: ['id', 'name', 'sub_title', 'base_price', 'selling_price', 'image'],
                  limit: 10
                }
              ]
            });

            if (!category) break;

            response = {
              id: category.id,
              name: category.name,
              description: category.description,
              icon: category.icon,  // ← already full URL from getter in model
              total_packages: category.packages?.length || 0,
              packages: (category.packages || []).map(p => ({
                id: p.id,
                name: p.name,
                sub_title: p.sub_title || '',
                base_price: p.base_price,
                selling_price: p.selling_price,
                image: p.image ? `${process.env.IMAGE_PATH}/packages/${p.image}` : null
              }))
            };

          } catch (error) {
            console.error('Error fetching package category:', error);
            throw error;
          }
          break;

        case 'speciality':
          // Get speciality details directly here
          try {
            const speciality = await db.Specialities.findByPk(reference_id);

            if (speciality) {
              // Get doctors with this speciality
              const doctors = await db.Profession.findAll({
                include: [
                  {
                    model: db.ProfessionSpeciality,
                    as: 'specialitiesList',
                    where: { speciality_id: reference_id },
                    include: [
                      {
                        model: db.Specialities,
                        as: 'specialityInfo'
                      }
                    ]
                  }
                ],
                limit: 10
              });

              // Get establishments that offer this speciality
              const establishments = await db.Establishment.findAll({
                include: [
                  {
                    model: db.EstablishmentSpeciality,
                    as: 'specialitiesList',
                    where: { speciality_id: reference_id },
                    include: [
                      {
                        model: db.Specialities,
                        as: 'specialityInfo'
                      }
                    ]
                  }
                ],
                limit: 10
              });

              response = {
                ...speciality.toJSON(),
                relatedDoctors: doctors.map(doc => ({
                  ...doc.toJSON(),
                  distance: '10 km',
                  rating: 4.5
                })),
                relatedHospitals: establishments.map(est => ({
                  ...est.toJSON(),
                  distance: '10 km',
                  rating: 4.5
                }))
              };
            }
          } catch (error) {
            console.error('Error getting speciality detail:', error);
            throw error;
          }
          break;

        default:
          return res
            .status(httpStatus.BAD_REQUEST)
            .json(new APIResponse({}, 'Invalid type specified.', httpStatus.BAD_REQUEST));
      }

      if (response) {
        return res
          .status(httpStatus.OK)
          .json(new APIResponse(response, `${type} details found.`, httpStatus.OK));
      } else {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(new APIResponse({}, `${type} details not found.`, httpStatus.NOT_FOUND));
      }

    } catch (error) {
      console.error('Error getting search result detail:', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(new APIResponse([], 'Something went wrong.', httpStatus.INTERNAL_SERVER_ERROR));
    }
  }

  // Helper method to get service details
  async getServiceDetail(serviceId) {
    try {
      const service = await db.Service.findByPk(serviceId, {
        include: [
          {
            model: db.Specialities,
            as: 'categoryInfo',
            attributes: ['id', 'name', 'icon']
          }
        ]
      });

      if (service) {
        const baseUrl = `${process.env.IMAGE_PATH || 'http://localhost:5710'}/services/`;
        return {
          ...service.toJSON(),
          image: service.image ? baseUrl + service.image : null
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting service detail:', error);
      throw error;
    }
  }

  // Helper method to get speciality details with related doctors/hospitals
  async getSpecialityDetail(specialityId) {
    try {
      const speciality = await db.Specialities.findByPk(specialityId);

      if (!speciality) {
        return null;
      }

      // Get doctors with this speciality
      const doctors = await db.Profession.findAll({
        include: [
          {
            model: db.ProfessionSpeciality,
            as: 'specialitiesList',
            where: { speciality_id: specialityId },
            include: [
              {
                model: db.Specialities,
                as: 'specialityInfo'
              }
            ]
          }
        ],
        limit: 10
      });

      // Get establishments that offer this speciality
      const establishments = await db.Establishment.findAll({
        include: [
          {
            model: db.EstablishmentSpeciality,
            as: 'specialitiesList',
            where: { speciality_id: specialityId },
            include: [
              {
                model: db.Specialities,
                as: 'specialityInfo'
              }
            ]
          }
        ],
        limit: 10
      });

      return {
        ...speciality.toJSON(),
        relatedDoctors: doctors.map(doc => ({
          ...doc.toJSON(),
          distance: '10 km',
          rating: 4.5
        })),
        relatedHospitals: establishments.map(est => ({
          ...est.toJSON(),
          distance: '10 km',
          rating: 4.5
        }))
      };

    } catch (error) {
      console.error('Error getting speciality detail:', error);
      throw error;
    }
  }
  async searchSpecialities(search_text, items_per_page, offset) {
    try {
      // Normalize search text for case-insensitive matching
      const searchTextLower = search_text.toLowerCase();

      // Query specialities with partial matching
      const specialities = await Speciality.findAndCountAll({
        where: {
          [Op.or]: [
            { keyword: { [Op.iLike]: `%${searchTextLower}%` } }, // Match keyword
            { '$entity.name$': { [Op.iLike]: `%${searchTextLower}%` } } // Match entity name
          ]
        },
        include: [
          {
            model: Entity, // Related model for entity data
            attributes: ['id', 'name', 'icon']
          }
        ],
        limit: items_per_page,
        offset: offset,
        raw: true,
        nest: true
      });

      // Sort results based on match priority using synchronous helper
      const sortedRows = specialities.rows.sort((a, b) => {
        const aKeyword = a.keyword.toLowerCase();
        const aName = a.entity.name.toLowerCase();
        const bKeyword = b.keyword.toLowerCase();
        const bName = b.entity.name.toLowerCase();

        const scoreA = calculateMatchScore(searchTextLower, aKeyword, aName);
        const scoreB = calculateMatchScore(searchTextLower, bKeyword, bName);

        return scoreB - scoreA; // Higher score comes first
      });

      return {
        rows: sortedRows,
        count: specialities.count
      };
    } catch (error) {
      console.error('Error in searchSpecialities service:', error);
      throw error;
    }
  }

  // Helper function to calculate match score (now synchronous)
  async calculateMatchScore(searchText, keyword, name) {
    let score = 0;

    // Priority 1: Keyword starts with search text
    if (keyword.startsWith(searchText)) {
      score += 100;
    }
    // Priority 2: Entity name starts with search text
    else if (name.startsWith(searchText)) {
      score += 80;
    }
    // Priority 3: Keyword contains search text
    else if (keyword.includes(searchText)) {
      score += 50;
    }
    // Priority 4: Entity name contains search text
    else if (name.includes(searchText)) {
      score += 30;
    }

    return score;
  }

  async getSpecialtiesByEstablishmentType(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(new APIResponse([], 'establishment_type ID is required.', httpStatus.BAD_REQUEST));
      }

      const response = await DashboardService.getSpecialtiesForEstablishmentType(id);
      if (response.length === 0) {
        return res
          .status(httpStatus.OK)
          .json(new APIResponse(response, 'No specialties found for this establishment type.', httpStatus.OK));
      }
      return res
        .status(httpStatus.OK)
        .json(new APIResponse(response, 'Specialties found.', httpStatus.OK));
    } catch (error) {
      console.error('getSpecialtiesByEstablishmentType error:', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            [],
            'Something went wrong.',
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }

  async getProfessionals(req, res) {
    try {
      const {
        available,
        search_text,
        gender,
        language_id,
        category_id,
        available_today,
        // insurance_id,
        establishment_id,
        slot,
        facility_id,
        acceptsInsurance,
        healineVerified,
        recommended,
        topRated,
        onlyOnline,
        profession_id
      } = req.query;

      const response = await DashboardService.getProfessionalsAdvanced({
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
        acceptsInsurance: acceptsInsurance === 'true' ? true : false,
        healineVerified: healineVerified === 'true' ? true : false,
        recommended: recommended === 'true' ? true : false,
        topRated: topRated === 'true' ? true : false,
        onlyOnline: onlyOnline === 'true',
        profession_id
      });

      return res.status(httpStatus.OK).json(
        new APIResponse(
          {
            rows: response.rows,
            totalRows: response.count
          },
          'Professionals list found.',
          httpStatus.OK
        )
      );
    } catch (error) {
      console.error('Error searching professionals:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        new APIResponse([], 'Something went wrong.', httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }

  async getEstablishment(req, res) {
    try {
      const {
        category_id,
        type,
        // insurance_id,
        service_id,
        // insurance_plan_id,
        topRated,
        acceptsInsurance,
        healineVerified,
        recommended,
        isOpenNow,
        searchText: searchTextParam,
        search_text,
        establishment_type,
        image_type,
        establishment_id
      } = req.query;

      let parsedEstablishmentType = establishment_type || type;
      if (parsedEstablishmentType && typeof parsedEstablishmentType === 'string' && parsedEstablishmentType.includes(',')) {
        parsedEstablishmentType = parsedEstablishmentType.split(',').map(id => id.trim());
      }

      const searchText = (searchTextParam ?? search_text ?? '').toString();
      const specialityId = req.query.speciality_id ?? category_id;
      
      // Call with updated params (removed location, offset, limit)
      const response = await DashboardService.getEstablishment({
        speciality_id: specialityId,
        establishment_type: parsedEstablishmentType,
        // insurance_id,
        service_id,
        // insurance_plan_id,
        acceptsInsurance: acceptsInsurance === 'true',
        healineVerified: healineVerified === 'true',
        recommended: recommended === 'true',
        topRated: topRated === 'true',
        isOpenNow: isOpenNow === 'true',
        searchText,
        image_type,
        establishment_id
      });

      if (establishment_id) {
        if (response.rows.length > 0) {
          const establishment = response.rows[0];
          
          // Get practice locations
          const practiceLocations = await DashboardService.getDoctorPracticeLocations(establishment_id);
          if (practiceLocations && practiceLocations.length > 0) {
            for (const item of practiceLocations) {
              item.rating = 4.5;
            }
          }
          establishment.practiceLocations = practiceLocations;

          // Set ratings for professions
          if (establishment.professionsList && establishment.professionsList.length > 0) {
            for (const item of establishment.professionsList) {
              if (item.professionInfo) {
                item.professionInfo.rating = 4.5;
              }
            }
          }

          const singlePayload = new APIResponse({ rows: [establishment], totalRows: 1 }, 'Data found.', httpStatus.OK);
          try {
            const body = JSON.stringify(singlePayload);
            const crypto = await import('crypto');
            const hash = crypto.createHash('sha256').update(body).digest('hex');
            res.set('X-Body-Checksum-SHA256', hash);
            return res.status(httpStatus.OK).send(body);
          } catch (e) {
            return res.status(httpStatus.OK).json(singlePayload);
          }
        } else {
          return res.status(httpStatus.NOT_FOUND).json(
            new APIResponse({ rows: [], totalRows: 0 }, 'Data not found.', httpStatus.NOT_FOUND)
          );
        }
      }

      // List response
      if (response.rows.length > 0) {
        const listPayload = new APIResponse({ rows: response.rows, totalRows: response.count }, 'Data found.', httpStatus.OK);
        try {
          const body = JSON.stringify(listPayload);
          const crypto = await import('crypto');
          const hash = crypto.createHash('sha256').update(body).digest('hex');
          res.set('X-Body-Checksum-SHA256', hash);
          return res.status(httpStatus.OK).send(body);
        } catch (e) {
          return res.status(httpStatus.OK).json(listPayload);
        }
      } else {
        return res.status(httpStatus.NOT_FOUND).json(
          new APIResponse({ rows: [], totalRows: response.count }, 'Data not found.', httpStatus.NOT_FOUND)
        );
      }
    } catch (error) {
      console.error('categoryEstablishmentSearchListNew error:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        new APIResponse([], 'Something went wrong.', httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }

}
export default new DashboardController();



  // async getServicesList(req, res) {
  //   try {
  //     const { categoryId, serviceType, search_text } = req.query;

  //     const whereClause = {};
  //     if (categoryId) whereClause.categoryId = +categoryId;
  //     if (serviceType) whereClause.serviceType = serviceType;
  //     if (search_text) whereClause.name = { [Op.like]: `%${search_text}%` };

  //     const services = await ServiceModel.findAll({
  //       attributes: [
  //         'id',
  //         'name',
  //         'categoryId',
  //         'serviceType',
  //         'price',
  //         'discountPrice',
  //         'resultTime',
  //         'homeSampleCollection',
  //         'image'
  //       ],
  //       where: whereClause,
  //       include: [
  //         { model: db.Specialities, as: 'categoryInfo', attributes: ['id', 'name', 'icon'] }
  //       ],
  //       order: [['id', 'DESC']]
  //     });

  
  //     const baseUrl = `${process.env.IMAGE_PATH || 'http://localhost:5710'}/services/`;
  //     const payload = services.map((item) => ({
  //       ...item.toJSON(),
  //       image: item.image ? baseUrl + item.image : null
  //     }));

  //     return res
  //       .status(httpStatus.OK)
  //       .json(new APIResponse(payload, 'Services fetched successfully', httpStatus.OK));
  //   } catch (err) {
  //     const errMessage = typeof err === 'string' ? err : err.message;
  //     return res
  //       .status(httpStatus.INTERNAL_SERVER_ERROR)
  //       .json(new APIResponse([], 'Error fetching services: ' + errMessage, httpStatus.INTERNAL_SERVER_ERROR));
  //   }
  // }



  // async createService(req, res) {
  //   try {
  //     const {
  //       serviceType,
  //       categoryId,
  //       name,
  //       description,
  //       hospitalDetails,
  //       price,
  //       discountPrice,
  //       resultTime,
  //       homeSampleCollection,
  //       testOverview,
  //       timeSchedule,
  //       insuranceList,
  //       requiredSamples,
  //       image
  //     } = req.body;

  //     const created = await ServiceModel.create({
  //       serviceType,
  //       categoryId,
  //       name,
  //       description,
  //       hospitalDetails,
  //       price,
  //       discountPrice,
  //       resultTime,
  //       homeSampleCollection,
  //       testOverview,
  //       timeSchedule,
  //       insuranceList,
  //       requiredSamples,
  //       image
  //     });

  //     return res
  //       .status(httpStatus.OK)
  //       .json(new APIResponse(created, 'Service created successfully', httpStatus.OK));
  //   } catch (error) {
  //     return res
  //       .status(httpStatus.INTERNAL_SERVER_ERROR)
  //       .json(new APIResponse({}, 'Failed to create service', httpStatus.INTERNAL_SERVER_ERROR));
  //   }
  // }
  // async createService(req, res) {
  //   try {
  //     const {
  //       serviceType,
  //       categoryId,
  //       name,
  //       description,
  //       establishment_id, // Changed from hospitalDetails to establishment_id
  //       price,
  //       discountPrice,
  //       resultTime,
  //       homeSampleCollection,
  //       testOverview,
  //       timeSchedule,
  //       recommended,
  //       // insuranceList,
  //       requiredSamples,
  //       image,
  //       working_hours,
  //     } = req.body;

  //     // Create the service
  //     const created = await ServiceModel.create({
  //       serviceType,
  //       categoryId,
  //       name,
  //       description,
  //       price,
  //       discountPrice,
  //       resultTime,
  //       homeSampleCollection,
  //       testOverview,
  //       timeSchedule,
  //       recommended,
  //       // insuranceList,
  //       requiredSamples,
  //       image,
  //     });

  //     // Link the service to the establishment
  //     if (establishment_id) {
  //       await ServiceModel.sequelize.models.EstablishmentService.create({
  //         service_id: created.id,
  //         establishment_id,
  //       });
  //     }

  //     // If working hours are provided, create entries in ServiceWorkingHours
  //     if (working_hours && Array.isArray(working_hours)) {
  //       const workingHoursData = working_hours.map((wh) => ({
  //         service_id: created.id,
  //         day_of_week: wh.day_of_week,
  //         start_time: wh.start_time,
  //         end_time: wh.end_time,
  //         is_day_off: wh.is_day_off || false,
  //       }));
  //       await ServiceModel.sequelize.models.ServiceWorkingHours.bulkCreate(workingHoursData);
  //     }

  //     return res
  //       .status(httpStatus.OK)
  //       .json(new APIResponse(created, 'Service created successfully', httpStatus.OK));
  //   } catch (error) {
  //     console.error('createService error:', error);
  //     return res
  //       .status(httpStatus.INTERNAL_SERVER_ERROR)
  //       .json(new APIResponse({}, 'Failed to create service', httpStatus.INTERNAL_SERVER_ERROR));
  //   }
  // }

    // async categoryEstablishmentSearchList(req, res) {
  //   try {
  //     const {
  //       latitude,
  //       longitude,
  //       category_id,
  //       type,
  //       insurance_id,
  //       service_id
  //     } = req.query;

  //     const response = await DashboardService.getEstablishmentSearchList(
  //       category_id,
  //       type,
  //       insurance_id,
  //       service_id
  //     );

  //     if (response && response.length > 0) {
  //       for (const item of response) {
  //         item.distance = '10 km';
  //         item.rating = 4.5;
  //       }
  //       return res
  //         .status(httpStatus.OK)
  //         .json(new APIResponse(response, 'Data found.', httpStatus.OK));
  //     } else {
  //       return res
  //         .status(httpStatus.NOT_FOUND)
  //         .json(
  //           new APIResponse(response, 'Data not found.', httpStatus.NOT_FOUND)
  //         );
  //     }
  //   } catch (error) {
  //     return res
  //       .status(httpStatus.INTERNAL_SERVER_ERROR)
  //       .json(
  //         new APIResponse(
  //           [],
  //           'Something went wrong.',
  //           httpStatus.INTERNAL_SERVER_ERROR
  //         )
  //       );
  //   }
  // }

  

    // async getInsurancesList(req, res) {
  //   try {
  //     const { is_top_insurances, search_text } = req.query;
  //     const response = await DashboardService.getInsurancesList(
  //       is_top_insurances,
  //       search_text
  //     );
  //     if (response && response.length > 0) {
  //       return res
  //         .status(httpStatus.OK)
  //         .json(
  //           new APIResponse(response, 'Bookmark list found.', httpStatus.OK)
  //         );
  //     } else {
  //       return res
  //         .status(httpStatus.NOT_FOUND)
  //         .json(
  //           new APIResponse(
  //             response,
  //             'Bookmarks not found.',
  //             httpStatus.NOT_FOUND
  //           )
  //         );
  //     }
  //   } catch (error) {
  //     return res
  //       .status(httpStatus.INTERNAL_SERVER_ERROR)
  //       .json(
  //         new APIResponse(
  //           [],
  //           'Something went wrong.',
  //           httpStatus.INTERNAL_SERVER_ERROR
  //         )
  //       );
  //   }
  // }
  // async getHealthTestList(req, res) {
  //   try {
  //     const { category_id, search_text } = req.query;
  //     const response = await DashboardService.getHealthTestList(
  //       category_id,
  //       search_text
  //     );
  //     if (response && response.length > 0) {
  //       return res
  //         .status(httpStatus.OK)
  //         .json(
  //           new APIResponse(response, 'Health tests list found.', httpStatus.OK)
  //         );
  //     } else {
  //       return res
  //         .status(httpStatus.NOT_FOUND)
  //         .json(
  //           new APIResponse(
  //             response,
  //             'Health tests not found.',
  //             httpStatus.NOT_FOUND
  //           )
  //         );
  //     }
  //   } catch (error) {
  //     return res
  //       .status(httpStatus.INTERNAL_SERVER_ERROR)
  //       .json(
  //         new APIResponse(
  //           [],
  //           'Something went wrong.',
  //           httpStatus.INTERNAL_SERVER_ERROR
  //         )
  //       );
  //   }
  // }
  // async getHealthTestDetail(req, res) {
  //   try {
  //     const { test_id } = req.query;
  //     const response = await DashboardService.getHealthTestDetail(test_id);
  //     if (response) {
  //       return res
  //         .status(httpStatus.OK)
  //         .json(
  //           new APIResponse(
  //             response,
  //             'Health tests detail found.',
  //             httpStatus.OK
  //           )
  //         );
  //     } else {
  //       return res
  //         .status(httpStatus.NOT_FOUND)
  //         .json(
  //           new APIResponse(
  //             response,
  //             'Health tests detail not found.',
  //             httpStatus.NOT_FOUND
  //           )
  //         );
  //     }
  //   } catch (error) {
  //     return res
  //       .status(httpStatus.INTERNAL_SERVER_ERROR)
  //       .json(
  //         new APIResponse(
  //           [],
  //           'Something went wrong.',
  //           httpStatus.INTERNAL_SERVER_ERROR
  //         )
  //       );
  //   }
  // }
  // async addInsuranceEnquiry(req, res) {
  //   try {
  //     const {
  //       insurance_id,
  //       name,
  //       email,
  //       phone_number,
  //       phone_code,
  //       birth_date
  //     } = req.body;
  //     const response = await CommonService.create('InsuranceEnquiry', {
  //       insurance_id,
  //       name,
  //       email,
  //       phone_number,
  //       phone_code,
  //       birth_date
  //     });
  //     if (response) {
  //       return res
  //         .status(httpStatus.OK)
  //         .json(
  //           new APIResponse(
  //             response,
  //             'Insurance enquiry added successfully.',
  //             httpStatus.OK
  //           )
  //         );
  //     } else {
  //       return res
  //         .status(httpStatus.INTERNAL_SERVER_ERROR)
  //         .json(
  //           new APIResponse(
  //             {},
  //             'Something went wrong while creating insurance enquiry.',
  //             httpStatus.INTERNAL_SERVER_ERROR
  //           )
  //         );
  //     }
  //   } catch (error) {
  //     return res
  //       .status(httpStatus.INTERNAL_SERVER_ERROR)
  //       .json(
  //         new APIResponse(
  //           [],
  //           'Something went wrong.',
  //           httpStatus.INTERNAL_SERVER_ERROR
  //         )
  //       );
  //   }
  // }
  // async addHealthTestBooking(req, res) {
  //   try {
  //     const {
  //       name,
  //       email,
  //       phone_number,
  //       phone_code,
  //       health_test_id,
  //       date_of_test,
  //       city_id,
  //       address
  //     } = req.body;
  //     const response = await CommonService.create('HealthTestBooking', {
  //       name,
  //       email,
  //       phone_number,
  //       phone_code,
  //       health_test_id,
  //       date_of_test,
  //       city_id,
  //       address,
  //       status: 1
  //     });
  //     if (response) {
  //       return res
  //         .status(httpStatus.OK)
  //         .json(
  //           new APIResponse(
  //             response,
  //             'Health test booking added successfully.',
  //             httpStatus.OK
  //           )
  //         );
  //     } else {
  //       return res
  //         .status(httpStatus.INTERNAL_SERVER_ERROR)
  //         .json(
  //           new APIResponse(
  //             {},
  //             'Something went wrong while creating health test booking.',
  //             httpStatus.INTERNAL_SERVER_ERROR
  //           )
  //         );
  //     }
  //   } catch (error) {
  //     return res
  //       .status(httpStatus.INTERNAL_SERVER_ERROR)
  //       .json(
  //         new APIResponse(
  //           [],
  //           'Something went wrong.',
  //           httpStatus.INTERNAL_SERVER_ERROR
  //         )
  //       );
  //   }
  // }
  //   async addServiceBooking(req, res) {
  //   try {
  //     // Generate unique booking ID
  //     const bookingId = 'SB-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  //     // Destructure all possible fields from request body
  //     const {
  //       service_id,
  //       customer_id,
  //       booked_date,
  //       slot,
  //       home_collection,
  //       payment_method,
  //       payment_id,
  //       insurance_id,
  //       insurance_details,
  //       user_id,
  //       patient_name,
  //       patient_age,
  //       patient_number,
  //       coupon_id,
  //       coupon_details,
  //       clinic_number,
  //       clinic_lat,
  //       clinic_long,
  //       booking_price,
  //       discount_price,

  //       // New fields for Medical Services
  //       result_time,
  //       test_details,
  //       time_slots,
  //       hospital_id,
  //       hospital_details,
  //       available_insurances
  //     } = req.body;

  //     // Fetch service details to populate defaults
  //     let serviceDefaults = {};
  //     if (service_id) {
  //       const service = await db.Service.findByPk(service_id);
  //       if (service) {
  //         serviceDefaults = {
  //           result_time: service.resultTime,
  //           booking_price: service.price,
  //           discount_price: service.discountPrice,
  //           hospital_details: service.hospitalDetails,
  //           test_details: {
  //             id: service.id,
  //             name: service.name,
  //             resultTime: service.resultTime,
  //             price: service.price,
  //             discountPrice: service.discountPrice,
  //             requiredSamples: service.requiredSamples || []
  //           }
  //         };
  //       }
  //     }

  //     const bookingData = {
  //       booking_id: bookingId,
  //       customer_id,
  //       service_id,
  //       booked_date,
  //       slot,
  //       home_collection: Boolean(home_collection),
  //       payment_method,
  //       payment_id,
  //       insurance_id,
  //       insurance_details,
  //       user_id,
  //       patient_name,
  //       patient_age,
  //       patient_number,
  //       coupon_id,
  //       coupon_details,
  //       clinic_number,
  //       clinic_lat,
  //       clinic_long,
  //       booking_price: booking_price || serviceDefaults.booking_price,
  //       discount_price: discount_price || serviceDefaults.discount_price,
  //       booking_status: 'active',

  //       // New fields with fallbacks to service defaults
  //       result_time: result_time || serviceDefaults.result_time,
  //       test_details: test_details || serviceDefaults.test_details,
  //       time_slots: time_slots || [],
  //       hospital_id: hospital_id || serviceDefaults.hospital_details?.id,
  //       hospital_details: hospital_details || serviceDefaults.hospital_details || {
  //         id: hospital_id || null,
  //         name: null,
  //         lat: clinic_lat || null,
  //         long: clinic_long || null,
  //         availableInsurances: available_insurances || []
  //       },
  //       available_insurances: available_insurances || serviceDefaults.hospital_details?.availableInsurances || []
  //     };

  //     const response = await CommonService.create('ServiceBooking', bookingData);
  //     if (response) {
  //       return res
  //         .status(httpStatus.OK)
  //         .json(
  //           new APIResponse(
  //             response,
  //             'Service booking added successfully.',
  //             httpStatus.OK
  //           )
  //         );
  //     } else {
  //       return res
  //         .status(httpStatus.INTERNAL_SERVER_ERROR)
  //         .json(
  //           new APIResponse(
  //             {},
  //             'Something went wrong while creating service booking.',
  //             httpStatus.INTERNAL_SERVER_ERROR
  //           )
  //         );
  //     }
  //   } catch (error) {
  //     console.error('addServiceBooking error:', error);
  //     return res
  //       .status(httpStatus.INTERNAL_SERVER_ERROR)
  //       .json(
  //         new APIResponse(
  //           [],
  //           'Something went wrong.',
  //           httpStatus.INTERNAL_SERVER_ERROR
  //         )
  //       );
  //   }
  // }
  // async addServiceBooking(req, res) {
  //   try {
  //     const bookingId = 'SB-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  //     const {
  //       service_id,
  //       customer_id,
  //       booked_date,
  //       slot,
  //       home_collection,
  //       payment_method,
  //       payment_id,
  //       // insurance_id,
  //       // insurance_details,
  //       user_id,
  //       patient_name,
  //       patient_age,
  //       patient_number,
  //       coupon_id,
  //       coupon_details,
  //       clinic_number,
  //       clinic_lat,
  //       clinic_long,
  //       booking_price,
  //       discount_price,
  //       result_time,
  //       test_details,
  //       time_slots,
  //       hospital_id,
  //       hospital_details,
  //       // available_insurances,
  //     } = req.body;

  //     // Fetch service details to populate defaults and validate working hours
  //     let serviceDefaults = {};
  //     if (service_id) {
  //       const service = await db.Service.findByPk(service_id, {
  //         include: [{ model: db.ServiceWorkingHours, as: 'working_hours' }],
  //       });
  //       if (!service) {
  //         return res
  //           .status(httpStatus.NOT_FOUND)
  //           .json(new APIResponse({}, 'Service not found', httpStatus.NOT_FOUND));
  //       }

  //       // Validate slot against working hours
  //       if (booked_date && slot) {
  //         const bookingDate = new Date(booked_date);
  //         const dayOfWeek = bookingDate.getDay();
  //         const workingHours = service.working_hours.find((wh) => wh.day_of_week === dayOfWeek && !wh.is_day_off);
  //         if (!workingHours) {
  //           return res
  //             .status(httpStatus.BAD_REQUEST)
  //             .json(new APIResponse({}, 'Service is not available on this day', httpStatus.BAD_REQUEST));
  //         }
  //         const [slotHour, slotMinute] = slot.split(':').map(Number);
  //         const [startHour, startMinute] = workingHours.start_time.split(':').map(Number);
  //         const [endHour, endMinute] = workingHours.end_time.split(':').map(Number);
  //         const slotTimeInMinutes = slotHour * 60 + slotMinute;
  //         const startTimeInMinutes = startHour * 60 + startMinute;
  //         const endTimeInMinutes = endHour * 60 + endMinute;

  //         if (slotTimeInMinutes < startTimeInMinutes || slotTimeInMinutes > endTimeInMinutes) {
  //           return res
  //             .status(httpStatus.BAD_REQUEST)
  //             .json(new APIResponse({}, 'Selected slot is outside service working hours', httpStatus.BAD_REQUEST));
  //         }
  //       }

  //       serviceDefaults = {
  //         result_time: service.resultTime,
  //         booking_price: service.price,
  //         discount_price: service.discountPrice,
  //         hospital_details: service.hospitalDetails,
  //         test_details: {
  //           id: service.id,
  //           name: service.name,
  //           resultTime: service.resultTime,
  //           price: service.price,
  //           discountPrice: service.discountPrice,
  //           requiredSamples: service.requiredSamples || [],
  //         },
  //       };
  //     }

  //     const bookingData = {
  //       booking_id: bookingId,
  //       customer_id,
  //       service_id,
  //       booked_date,
  //       slot,
  //       home_collection: Boolean(home_collection),
  //       payment_method,
  //       payment_id,
  //       // insurance_id,
  //       // insurance_details,
  //       user_id,
  //       patient_name,
  //       patient_age,
  //       patient_number,
  //       coupon_id,
  //       coupon_details,
  //       clinic_number,
  //       clinic_lat,
  //       clinic_long,
  //       booking_price: booking_price || serviceDefaults.booking_price,
  //       discount_price: discount_price || serviceDefaults.discount_price,
  //       booking_status: 'active',
  //       result_time: result_time || serviceDefaults.result_time,
  //       test_details: test_details || serviceDefaults.test_details,
  //       // time_slots: time_slots || [],
  //       hospital_id: hospital_id || serviceDefaults.hospital_details?.id,
  //       hospital_details: hospital_details || serviceDefaults.hospital_details || {
  //         id: hospital_id || null,
  //         name: null,
  //         lat: clinic_lat || null,
  //         long: clinic_long || null,
  //         // availableInsurances: available_insurances || [],
  //       },
  //       // available_insurances: available_insurances || serviceDefaults.hospital_details?.availableInsurances || [],
  //     };

  //     const response = await CommonService.create('ServiceBooking', bookingData);
  //     if (response) {
  //       return res
  //         .status(httpStatus.OK)
  //         .json(
  //           new APIResponse(
  //             response,
  //             'Service booking added successfully.',
  //             httpStatus.OK
  //           )
  //         );
  //     } else {
  //       return res
  //         .status(httpStatus.INTERNAL_SERVER_ERROR)
  //         .json(
  //           new APIResponse(
  //             {},
  //             'Something went wrong while creating service booking.',
  //             httpStatus.INTERNAL_SERVER_ERROR
  //           )
  //         );
  //     }
  //   } catch (error) {
  //     console.error('addServiceBooking error:', error);
  //     return res
  //       .status(httpStatus.INTERNAL_SERVER_ERROR)
  //       .json(
  //         new APIResponse(
  //           [],
  //           'Something went wrong.',
  //           httpStatus.INTERNAL_SERVER_ERROR
  //         )
  //       );
  //   }
  // }