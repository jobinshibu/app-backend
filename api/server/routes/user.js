import express from 'express';
import { routeValidator } from '../utils/routeValidator.js';
import Validators from '../validators/user.js';
import enums from '../utils/utils.js';
import UserController from '../controllers/UserController.js';
import ShippingAddressController from '../controllers/ShippingAddressController.js';
import BookingController from '../controllers/BookingController.js';
import ServiceController from '../controllers/ServiceController.js';
import uploadCustomerImages from '../middelware/uploadCustomerImages.js';
// import InsuranceController from '../controllers/InsuranceController.js';
import PaymentController from '../controllers/PaymentController.js';
import InsuranceController from '../controllers/InsuranceController.js';
import PharmacyController from '../controllers/PharmacyController.js';
import PrescriptionController from '../controllers/PrescriptionController.js';
import uploadPrescription from '../middelware/uploadPrescription.js';

const router = express.Router();

const bypassAuth = (req, res, next) => {
  next();
};


// User Signup
router.post(
  '/signup',
  routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.signupValidator),
  UserController.Signup
);

// User Login
router.post(
  '/login',
  routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.loginValidator),
  UserController.login
);

// OTP Login via WhatsApp
router.post('/send-otp-whatsapp', bypassAuth, UserController.sendOtpWhatsApp);
router.post('/verify-otp-whatsapp', UserController.OtpVerifyWhatsApp);

// Mobile number update OTP
router.post(
  '/request-mobile-update-otp',
  routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.requestMobileUpdateOtpValidator),
  UserController.requestMobileUpdateOtp
);
router.post(
  '/verify-mobile-update-otp',
  routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.verifyMobileUpdateOtpValidator),
  UserController.verifyMobileUpdateOtp
);

// Update User Details
router.post(
  '/update-user',
  routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.updateCustomerValidator),
  UserController.updateUser
);

// Request OTP for soft-deleting customer
router.post('/request-delete-otp', UserController.requestDeleteCustomerOtp);

// Verify OTP and soft-delete customer
router.post('/verify-delete-otp', UserController.verifyDeleteCustomerOtp);


router.delete('/users/:user_id', UserController.softDeleteUser);

// Fetch customer by mobile number (and include family)
router.get('/customer/:mobile', UserController.getCustomerByMobile);

// Update customer by id (and return with family)
router.put('/customer/:id', UserController.updateCustomerById);

// Add family members by customer id (array or single object)
router.post('/customer/:id/family', UserController.addFamilyMembers);
router.put('/customer/:id/family/:familyId', UserController.editFamily);
router.delete('/customer/:id/family/:familyId', UserController.deleteFamily);
// ******************************************************************* SHIPPING ADDRESS Routes ***********************************************************************

// Add a new shipping address
router.post(
  '/shipping-address',
  routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.shippingAddressValidator), // you can define this validator
  ShippingAddressController.add
);

// Update existing address
router.put(
  '/shipping-address/:id',
  routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.shippingAddressValidator),
  ShippingAddressController.update
);

// Delete address
router.delete(
  '/shipping-address/:id',
  ShippingAddressController.delete
);

// Optional: get all addresses for a customer
router.get(
  '/shipping-addresses/:customerId',
  ShippingAddressController.getByCustomerId
);
router.post('/booking', BookingController.createBooking);
router.get('/booking/:customerId', BookingController.listBookings);
router.delete('/booking/:id', BookingController.cancelBooking);
router.put('/booking/:id', BookingController.updateBooking);
router.get('/bookings/:id', BookingController.getBookingById);


//----------------------SERVICE ROUTER---------------------------

router.get('/packages', ServiceController.listPackages);
router.get('/packages/:id', ServiceController.getPackageDetails);

router.get('/package-bookings/:customerId', ServiceController.listPackageBookings);
router.get('/package-booking/:id', ServiceController.getPackageBookingById);
router.post('/package-booking', ServiceController.createPackageBooking);

router.get('/package-categories', ServiceController.listPackageCategories);
router.get('/categories/:categoryId/packages', ServiceController.getPackagesByCategory);
router.delete('/package-booking/:id', ServiceController.cancelPackageBooking);
router.put('/package-booking/:id', ServiceController.reschedulePackageBooking);

router.post("/package-bundle/purchase", (req, res) => ServiceController.purchaseBundle(req, res));
router.post("/verify-b2b-coupon", (req, res) => ServiceController.verifyB2BCoupon(req, res));
router.get("/my-bundles", (req, res) => ServiceController.getMyBundles(req, res));


//----------------------PAYMENT ROUTER---------------------------
//---------------------------------------------------------------

// ==================== PAYMENT ROUTES ====================
// PCI-COMPLIANT: All card data handled by Stripe Elements on frontend
// Backend never sees raw card numbers or CVV

// Create payment intent for booking payment
router.post('/create-intent', PaymentController.createPaymentIntent);

// Create setup intent for saving card (PCI-safe: frontend uses Stripe Elements)
router.post('/create-setup-intent', PaymentController.createSetupIntent);

// Get saved cards (fetched from Stripe, no sensitive data)
router.get('/saved-cards', PaymentController.getSavedCards);

// Delete saved card (uses Payment Methods API - PCI-compliant)
router.post('/delete-card', PaymentController.deleteCard);

// Payment history
router.get('/history', PaymentController.getPaymentHistory);

// Pay with saved card
router.post('/pay-with-saved-card', PaymentController.payWithSavedCard);


//-----------------------------------------------------------------------
//---------------- INSURANCE ROUTER -------------------------------------
//-----------------------------------------------------------------------
router.get('/customer-insurances', InsuranceController.getCustomerInsurance);
router.get('/customer-insurance/:id', InsuranceController.getCustomerInsuranceById);
router.post('/customer-insurance', InsuranceController.addCustomerInsurance);
router.put('/customer-insurance/:id', InsuranceController.updateCustomerInsurance);
router.delete('/customer-insurance/:id', InsuranceController.deleteCustomerInsurance);

router.post("/insurance/ocr-parse", InsuranceController.ocrParse);

router.get('/insurance-plans', InsuranceController.getAllPlans);
router.get('/insurance-plans/:id', InsuranceController.getPlanById);

router.get('/insurance-companies', InsuranceController.getCompanies);
router.get('/insurance-networks', InsuranceController.getNetworksByCompany);
router.get('/insurance-plans-for-select', InsuranceController.getPlansByNetwork);

router.get('/insurance-specialities', InsuranceController.getInsuranceSpecialities);
router.get('/insurance-specialities/:id', InsuranceController.getInsuranceSpecialityById);

router.post('/leads', InsuranceController.createLead);
// router.put('/leads/:lead_id', InsuranceController.updateLead);

// *******************************************************************
// ******************** PHARMACY CART & CHECKOUT *********************
// *******************************************************************

// Get current user's cart
router.get(
  '/pharmacy/cart',
  PharmacyController.getCart
);

// Add item to cart
router.post(
  '/pharmacy/cart/add',
  PharmacyController.addToCart
);

// Update cart item quantity
router.put(
  '/pharmacy/cart/update',
  PharmacyController.updateCartItem
);

// Remove item from cart
router.delete(
  '/pharmacy/cart/remove/:itemId',
  PharmacyController.removeCartItem
);

// Clear entire cart
router.delete(
  '/pharmacy/cart/clear',
  PharmacyController.clearCart
);

// Checkout pharmacy cart → create order
router.post(
  '/pharmacy/checkout',
  PharmacyController.checkout
);

// Get pharmacy orders for logged-in user
router.get(
  '/pharmacy/orders',
  PharmacyController.getOrders
);

// Get pharmacy order details
router.get(
  '/pharmacy/orders/:orderId',
  PharmacyController.getOrderDetails
);

router.post(
  '/pharmacy/prescription/parse',
  uploadPrescription.single('prescription'), // 👈 IMPORTANT
  PrescriptionController.parsePrescription
);



export default router;






// ******************************************************************* GET Routes ************************************************************************************************

// *route   GET /
// ?desc    get user by id
// @access  User / Admin

/*router.get(
  '/userById',
  // routeValidator(enums.PAYLOAD_TYPE.QUERY, Validators.getUserByIdValidator),
  UserController.getUser
);

// ******************************************************************* POST Routes ************************************************************************************************

// *route   POST /signup
// ?desc    signup for user
// @access  User / Admin

router.post(
  '/userDetails',
  cpUpload,
  routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.userValidator),
  UserController.userDetails
);
*/

// router.post(
//   '/send-otp',
//   routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.mobileValidator),
//   UserController.sendOtp
// );
// //otp verification
// router.post(
//   '/Otp',
//   routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.mobileOtpValidator),
//   UserController.OtpVerify
// );
// router.post(
//   '/add-user-insurance',
//   routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.addUserInsuranceValidator),
//   UserController.addUserInsurance
// );
// router.get('/get-user-insurance-info', UserController.getUserInsuranceInfo);
// router.delete('/delete-user-insurance', UserController.deleteUserInsurance);

//forgot password apis
// router.post(
//   '/send-otp-on-email',
//   routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.emailValidator),
//   UserController.sendOtpOnEmail
// );
// router.post(
//   '/verify-forgot-password-otp',
//   routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.emailOtpValidator),
//   UserController.emailOtpVerify
// );

// router.post(
//   '/reset-password',
//   routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.resetPasswordValidator),
//   UserController.resetPassword
// );

// // Service booking routes (lab/health services)
// router.post(
//   '/service-booking',
//   routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.serviceBookingValidator),
//   ServiceBookingController.createServiceBooking
// );
// router.get('/service-booking/:customerId', ServiceBookingController.listServiceBookings);
// router.get('/service-booking-detail/:id', ServiceBookingController.getServiceBookingById);
// router.put(
//   '/service-booking/:id',
//   routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.serviceBookingUpdateValidator),
//   ServiceBookingController.updateServiceBooking
// );
// router.delete('/service-booking/:id', ServiceBookingController.cancelServiceBooking);
/*
router.post(
  '/reset-password',
  routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.resetPasswordValidator),
  UserController.resetPassword
);



//credit card CRUD
router.post(
  '/add-card',
  routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.validateCardDetail),
  UserController.addCard
);
router.get('/get-cards', UserController.getUserCards);
router.delete('/delete-card/:cardId', UserController.deleteCard);

// *route   POST /login
// ?desc    login for user
// @access  User / Admin
*/

// ******************************************************************* PUT Routes ************************************************************************************************

// *route   PUT /
// ?desc    update user
// @access  User / Admin
// router.put(
//   '/updateprofile',
//   routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.updateUserValidator),
//   UserController.update
// );
// router.put(
//   '/update-user',
//   routeValidator(
//     enums.PAYLOAD_TYPE.BODY,
//     Validators.updateUserAccountValidator
//   ),
//   UserController.updateUser
// );
// router.post(
//   '/update-fcm-token',
//   routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.updateFcmTokenValidator),
//   UserController.updateFcmToken
// );

// ******************************************************************* DELETE Routes ************************************************************************************************

// *route   DELETE /
// ?desc    delete user by id
// @access  User / Admin
// router.delete(
//   '/:id',
//   // routeValidator(enums.PAYLOAD_TYPE.PARAMS, Validators.deleteUserValidator),
//   UserController.delete
// );


// ******************************************************************* Insurance Router ************************************************************************************************
// router.get('/providers', InsuranceController.getInsuranceProviders);
// router.get('/plans/:insurance_id', InsuranceController.getInsurancePlans);

// // Customer insurance management
// router.post('/customer-insurance',
//   // routeValidator(),
//   InsuranceController.addUpdateCustomerInsurance
// );

// router.get('/customer-insurance/:customer_id?', InsuranceController.getCustomerInsurance);
// router.put('/customer-insurance/:id', InsuranceController.addUpdateCustomerInsurance);
// router.delete('/customer-insurance/:id?', InsuranceController.deleteCustomerInsurance);

// Insurance enquiry
// router.post('/enquiry',
//   routeValidator(enums.PAYLOAD_TYPE.BODY, {
//     name: 'required|string',
//     email: 'required|email',
//     phone_code: 'required|string',
//     phone_number: 'required|string',
//     birth_date: 'required|date',
//     insurance_id: 'integer'
//   }),
//   InsuranceController.submitInsuranceEnquiry
// );

// Insurance card verification (OCR)
// router.post('/verify-card',
//   routeValidator(enums.PAYLOAD_TYPE.BODY, {
//     image_base64: 'required|string'
//   }),
//   InsuranceController.verifyInsuranceCard
// );

// Insurance coverage and validation
// router.get('/coverage', InsuranceController.getInsuranceCoverage);
// router.post('/validate-booking',
//   routeValidator(enums.PAYLOAD_TYPE.BODY, {
//     customer_id: 'required|integer',
//     establishment_id: 'required|integer',
//     service_id: 'integer',
//     estimated_amount: 'numeric'
//   }),
//   InsuranceController.validateInsuranceForBooking
// );