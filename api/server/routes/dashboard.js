import express from 'express';

import DashboardController from '../controllers/DashboardController.js';
import Validators from '../validators/user.js';
import { routeValidator } from '../utils/routeValidator.js';
import { expressjwt } from 'express-jwt';
import enums from '../utils/utils.js';
import SearchService from '../services/search.js'; // Ensure this import is present
import httpStatus from 'http-status';
import APIResponse from '../utils/APIResponse.js';
import SearchController from '../controllers/SearchController.js';
import MedicalRecordsController from '../controllers/MedicalRecordsController.js';
import PharmacyController from '../controllers/PharmacyController.js';
import ServiceController from '../controllers/ServiceController.js';

const router = express.Router();


router.get('/categories', DashboardController.getCategoriesList);
router.get('/faqs', DashboardController.getFaqList);
router.get('/services', DashboardController.getServicesList);

router.get('/facilities', DashboardController.getFacilitiesList);
router.get('/establishment-types', DashboardController.getEstablishmentTypesList);

router.get('/demo-login', DashboardController.getDemoList);


router.get('/banners', DashboardController.getBannersList);
router.get('/hospitals', DashboardController.getHospitalsList);
router.get('/pharmacy-list', DashboardController.getPharmacyList);

router.get(
  '/category-profession-search',
  DashboardController.categoryProfessionSearchList
);

router.get(
  '/category-establishment-search-new',
  DashboardController.categoryEstablishmentSearchListNew
);

router.get('/professionals/search', DashboardController.searchProfessionals);

router.get('/professionals-details', DashboardController.getProfessionals);

router.get('/establishment-details', DashboardController.getEstablishment);


router.post('/save-bookmark', DashboardController.saveRemoveBookMark);
router.get('/bookmark-list', DashboardController.getBookmarkList);


// Search API
router.get('/search', SearchController.search);
router.get('/search-result-details', DashboardController.getSearchResultDetail);
router.get('/popular-searches', SearchController.getPopularSearches);


router.post('/sync-search-data', async (req, res) => {
  try {
    const response = await SearchService.syncSearchData();
    return res
      .status(httpStatus.OK)
      .json(new APIResponse(response, 'Search data synced.', httpStatus.OK));
  } catch (error) {
    console.error('Error syncing search data:', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(new APIResponse({}, 'Failed to sync search data.', httpStatus.INTERNAL_SERVER_ERROR));
  }
});


// Medical Records Routes
router.post(
  '/medical-records',
  MedicalRecordsController.uploadFile, // Handle file upload
  routeValidator(enums.PAYLOAD_TYPE.BODY.addMedicalRecordValidator),
  MedicalRecordsController.addMedicalRecord
);

router.get('/medical-records', MedicalRecordsController.getMedicalRecords);
router.get('/medical-records/:id', MedicalRecordsController.getMedicalRecordById);
router.put(
  '/medical-records/:id',
  MedicalRecordsController.uploadFile, // Optional file update
  routeValidator(enums.PAYLOAD_TYPE.BODY.updateMedicalRecordValidator),
  MedicalRecordsController.updateMedicalRecord
);

router.get('/specialties-for-clinics', DashboardController.getSpecialtiesForClinics);

router.delete('/medical-records/:id', MedicalRecordsController.deleteMedicalRecord);


//---------------------------------------------------------------------------
//------------------------- PHARMACY ROUTES ---------------------------------
//---------------------------------------------------------------------------

router.get('/categories', PharmacyController.getCategories);
router.get('/brands', PharmacyController.getBrands);
router.get('/products/:id', PharmacyController.getProductDetails);
router.get('/pharmacies/:id', PharmacyController.getPharmacyDetails);




// ================== PACKAGE BUNDLES (CUSTOMER SIDE) ==================

router.get('/package-bundles', ServiceController.listPackageBundles);
router.get('/package-bundles/:id', ServiceController.getPackageBundleDetails);


export default router;




// router.post(
//   '/services',
//   routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.serviceCreateValidator),
//   DashboardController.createService
// );
// router.post(
//   '/service',
//   routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.serviceCreateValidator),
//   DashboardController.createService
// );
// router.post('/services', DashboardController.createService);

// router.get('/service-working-hours/:serviceId', async (req, res) => {
//   try {
//     const { serviceId } = req.params;
//     const { date } = req.query;

//     const service = await database.Service.findByPk(serviceId, {
//       include: [
//         {
//           model: database.ServiceWorkingHours,
//           as: 'working_hours',
//           attributes: ['day_of_week', 'start_time', 'end_time', 'is_day_off'],
//         },
//       ],
//     });

//     if (!service) {
//       return res
//         .status(httpStatus.NOT_FOUND)
//         .json(new APIResponse({}, 'Service not found', httpStatus.NOT_FOUND));
//     }

//     const bookingDate = date ? moment(date) : moment();
//     const dayOfWeek = bookingDate.day();
//     const workingHours = service.working_hours.filter(
//       (wh) => wh.day_of_week === dayOfWeek && !wh.is_day_off
//     );

//     return res
//       .status(httpStatus.OK)
//       .json(new APIResponse(workingHours, 'Service working hours fetched successfully', httpStatus.OK));
//   } catch (error) {
//     console.error('getServiceWorkingHours error:', error);
//     return res
//       .status(httpStatus.INTERNAL_SERVER_ERROR)
//       .json(new APIResponse({}, 'Failed to fetch service working hours', httpStatus.INTERNAL_SERVER_ERROR));
//   }
// });

// router.get(
//   '/category-establishment-search',
//   DashboardController.categoryEstablishmentSearchList
// );

router.get('/professions-detail', DashboardController.getProfessionsDetail);
router.get('/establishment-detail', DashboardController.getEstablishmentDetail);
// router.post('/save-bookmark',  Validators.addBookMarkValidator,,DashboardController.saveRemoveBookMark);

// router.get('/insurances-list', DashboardController.getInsurancesList);

// router.post(
//   '/add-insurance-enquiry',
//   routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.insuranceEnquiryValidator),
//   DashboardController.addInsuranceEnquiry
// );

// router.get('/health-test-list', DashboardController.getHealthTestList);
// router.get('/health-test-detail', DashboardController.getHealthTestDetail);
// router.post(
//   '/add-health-test-booking',
//   routeValidator(
//     enums.PAYLOAD_TYPE.BODY,
//     Validators.healthTestBookingValidator
//   ),
//   DashboardController.addHealthTestBooking
// );

// router.post(
//   '/add-service-booking',
//   routeValidator(
//     enums.PAYLOAD_TYPE.BODY,
//     Validators.serviceBookingValidator
//   ),
//   DashboardController.addServiceBooking
// );