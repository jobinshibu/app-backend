import Joi from 'joi';
import enums from '../utils/utils.js';
console.log('data : ', new Date());
export default {
  signupValidator: Joi.object().keys({
    first_name: Joi.optional(),
    last_name: Joi.optional(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(16).required(),
    mobile_country_code: Joi.string().required(),
    mobile_no: Joi.number().required(),
    gender: Joi.optional()
  }),
  // Add this to your existing validators in the validation file

  establishmentSearchValidator: Joi.object().keys({
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    category_id: Joi.number().optional(),
    speciality_id: Joi.number().optional(),
    type: Joi.alternatives().try(
      Joi.number(),
      Joi.string(),
      Joi.array().items(Joi.alternatives().try(Joi.number(), Joi.string()))
    ).optional(),
    establishment_type: Joi.alternatives().try(
      Joi.number(),
      Joi.string(),
      Joi.array().items(Joi.alternatives().try(Joi.number(), Joi.string()))
    ).optional(),
    insurance_id: Joi.number().optional(),
    service_id: Joi.number().optional(),
    page_no: Joi.number().positive().default(1),
    items_per_page: Joi.number().positive().max(100).default(10),
    insurance_plan_id: Joi.number().optional(),
    acceptsInsurance: Joi.boolean().optional(),
    healineVerified: Joi.boolean().optional(),
    recommended: Joi.boolean().optional(),
    topRated: Joi.boolean().optional(),
    isOpenNow: Joi.boolean().optional(),
    searchText: Joi.string().optional(),
    search_text: Joi.string().optional(),
    establishment_id: Joi.number().optional(),
    image_type: Joi.string().valid('main', 'gallery').optional(),
    active_status: Joi.boolean().optional()  // ADD THIS LINE

  }),
  loginValidator: Joi.object().keys({
    userName: Joi.required(),
    password: Joi.string().required()
  }),
  mobileValidator: Joi.object().keys({
    is_email: Joi.number().required(),
    mobile: Joi.alternatives().conditional('is_email', {
      is: 0,
      then: Joi.number().required(),
      otherwise: Joi.optional()
    }),
    phone_code: Joi.alternatives().conditional('is_email', {
      is: 0,
      then: Joi.string().required(),
      otherwise: Joi.optional()
    }),
    email: Joi.alternatives().conditional('is_email', {
      is: 1,
      then: Joi.string().email().required(),
      otherwise: Joi.optional()
    })
  }),

  mobileOtpValidator: Joi.object().keys({
    is_email: Joi.number().required(),
    mobile: Joi.alternatives().conditional('is_email', {
      is: 0,
      then: Joi.number().required(),
      otherwise: Joi.optional()
    }),
    otp: Joi.number().required(),
    email: Joi.alternatives().conditional('is_email', {
      is: 1,
      then: Joi.string().email().required(),
      otherwise: Joi.optional()
    })
  }),

  sendOtpWhatsAppValidator: Joi.object().keys({
    mobile: Joi.number().required(),
    phone_code: Joi.string().required(),
    // otp: Joi.string().required()  // OTP required field
  }),

  verifyOtpWhatsAppValidator: Joi.object().keys({
    mobile: Joi.number().required(),
    phone_code: Joi.string().required(),
    pin: Joi.string().required() // Changed from number to string, removed pinId
  }),

  // Mobile update OTP flow
  requestMobileUpdateOtpValidator: Joi.object().keys({
    existing_mobile: Joi.number().required(),
    existing_phone_code: Joi.string().required(),
    new_mobile: Joi.number().required(),
    new_phone_code: Joi.string().required()
  }),
  verifyMobileUpdateOtpValidator: Joi.object().keys({
    existing_mobile: Joi.number().required(),
    existing_phone_code: Joi.string().required(),
    new_mobile: Joi.number().required(),
    new_phone_code: Joi.string().required(),
    otp: Joi.alternatives().try(Joi.number(), Joi.string()).required()
  }),

  getUserByIdValidator: Joi.object().keys({
    userId: Joi.number().required()
  }),
  addUserInsuranceValidator: Joi.object().keys({
    insurance_id: Joi.number().required(),
    id: Joi.number().required(),
    plan_id: Joi.number().required(),
    policy_number: Joi.optional(),
    policy_holder_name: Joi.string().required(),
    premium_amount: Joi.number().required(),
    coverage_amount: Joi.number().required(),
    start_date: Joi.date().required(),
    end_date: Joi.date().required(),
    status: Joi.number().required(),
    policy_type: Joi.number().required()
  }),
  addBookMarkValidator: Joi.object().keys({
    user_id: Joi.number().required(),
    establishment_id: Joi.number().required(),
    is_save: Joi.number().required()
  }),
  insuranceEnquiryValidator: Joi.object().keys({
    insurance_id: Joi.number().required(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone_code: Joi.string().required(),
    phone_number: Joi.number().required(),
    birth_date: Joi.date().required()
  }),
  healthTestBookingValidator: Joi.object().keys({
    health_test_id: Joi.number().required(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone_code: Joi.string().required(),
    phone_number: Joi.number().required(),
    date_of_test: Joi.date().required(),
    city_id: Joi.number().required(),
    address: Joi.string().required()
  }),
  emailValidator: Joi.object().keys({
    email: Joi.string().email().required()
  }),
  emailOtpValidator: Joi.object().keys({
    otp: Joi.number().required(),
    email: Joi.string().email().required()
  }),
  resetPasswordValidator: Joi.object().keys({
    user_id: Joi.number().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(16).required()
  }),
  updateCustomerValidator: Joi.object().keys({
    first_name: Joi.string().max(100).optional(),
    last_name: Joi.string().max(100).optional(),
    email: Joi.string().email().required()
  }),
  shippingAddressValidator: Joi.object({
    customer_id: Joi.number().required(),
    name: Joi.string().trim().required(),
    address: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    // zip_code: Joi.string().trim().optional(),
    country: Joi.string().trim().required(),
    phone_number: Joi.string().trim().required(),
    address_type: Joi.string().valid('house', 'office', 'apartment').optional().default(null),
    is_default_address: Joi.boolean().default(false),
    latitude: Joi.number().allow(null).optional().default(null),
    longitude: Joi.number().allow(null).optional().default(null),
    landmark: Joi.string().trim().allow(null, '').optional().default(null),
    street: Joi.string().trim().allow(null, '').optional().default(null),
    address_label: Joi.string().trim().allow(null, '').optional().default(null),
    Housename: Joi.string().trim().allow(null, '').optional().default(null),
    building_name: Joi.string().trim().allow(null, '').optional().default(null),
    apartment_number: Joi.string().trim().allow(null, '').optional().default(null),
    company_name: Joi.string().trim().allow(null, '').optional().default(null),
    floor: Joi.string().trim().allow(null, '').optional().default(null),
    additional_directions: Joi.string().trim().allow(null, '').optional().default(null)
  }),
  // Service booking validators
  serviceCreateValidator: Joi.object({
    serviceType: Joi.string().valid('forWomen', 'forMen', 'forKid', 'forSeniors').optional(),
    categoryId: Joi.number().integer().required(),
    name: Joi.string().max(255).required(),
    description: Joi.string().optional(),
    hospitalDetails: Joi.object().optional(),
    price: Joi.number().optional(),
    discountPrice: Joi.number().optional(),
    resultTime: Joi.string().optional(),
    homeSampleCollection: Joi.boolean().optional(),
    testOverview: Joi.array().items(Joi.object()).optional(),
    timeSchedule: Joi.string().optional(),
    insuranceList: Joi.array().items(Joi.string()).optional(),
    requiredSamples: Joi.array().items(Joi.string()).optional(),
    image: Joi.string().optional(),
    working_hours: Joi.array()
      .items(
        Joi.object({
          day_of_week: Joi.number().integer().min(0).max(6).required(),
          start_time: Joi.alternatives().conditional('is_day_off', {
            is: true,
            then: Joi.string().optional(),
            otherwise: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          }),
          end_time: Joi.alternatives().conditional('is_day_off', {
            is: true,
            then: Joi.string().optional(),
            otherwise: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          }),
          is_day_off: Joi.boolean().default(false),
        })
      )
      .optional(),
  }),

  serviceBookingUpdateValidator: Joi.object({
    service_id: Joi.number().optional(),
    booked_date: Joi.string().optional(),
    slot: Joi.string().optional(),
    home_collection: Joi.boolean().optional(),
    payment_method: Joi.string().optional(),
    payment_id: Joi.string().optional(),
    insurance_id: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
    insurance_details: Joi.object().unknown(true).optional(),
    user_id: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
    patient_name: Joi.string().optional(),
    patient_age: Joi.number().optional(),
    patient_number: Joi.string().optional(),
    coupon_id: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
    coupon_details: Joi.object().unknown(true).optional(),
    clinic_number: Joi.string().optional(),
    clinic_lat: Joi.number().optional(),
    clinic_long: Joi.number().optional(),
    booking_price: Joi.number().optional(),
    discount_price: Joi.number().optional(),
    booking_status: Joi.string().valid('active', 'cancelled', 'completed').optional(),
    status: Joi.number().optional()
  }),
  // Service create validator - Modern approach
  serviceBookingValidator: Joi.object({
    service_id: Joi.number().integer().required(),
    customer_id: Joi.number().integer().required(),
    establishment_id: Joi.number().integer().required(),
    booked_date: Joi.string().optional().default(''),
    slot: Joi.string().optional().default(''),
    home_collection: Joi.boolean().default(false),
    payment_method: Joi.string().optional().default(''),
    payment_id: Joi.string().optional().default(''),
    insurance_id: Joi.string().optional().default(''),
    insurance_details: Joi.object().optional().default(null),
    user_id: Joi.string().optional().default(''),
    patient_name: Joi.string().optional().default(''),
    patient_age: Joi.number().integer().optional().default(null),
    patient_number: Joi.string().optional().default(''),
    coupon_id: Joi.string().optional().default(''),
    coupon_details: Joi.object().optional().default(null),
    coupon_ids: Joi.array().items(Joi.string()).optional().default([]),
    time_slots: Joi.array().items(Joi.object()).optional().default([]),
    clinic_number: Joi.string().optional().default(''),
    clinic_lat: Joi.number().optional().default(null),
    clinic_long: Joi.number().optional().default(null),
    booking_price: Joi.number().optional().default(null),
    discount_price: Joi.number().optional().default(null)
  }),


  // Favourite

  addFavoriteValidator: Joi.object().keys({
    customer_id: Joi.number().integer().positive().required(),
    type: Joi.string().valid('doctor', 'hospital', 'service', 'speciality', 'clinic', 'pharmacy').required(),
    reference_id: Joi.number().integer().positive().required()
  }),

  removeFavoriteValidator: Joi.object().keys({
    customer_id: Joi.number().integer().positive().required(),
    type: Joi.string().valid('doctor', 'hospital', 'service', 'speciality', 'clinic', 'pharmacy').required(),
    reference_id: Joi.number().integer().positive().required()
  }),

  checkFavoriteStatusValidator: Joi.object({
    customer_id: Joi.number().integer().positive().required().messages({
      'number.base': 'customer_id must be a number',
      'number.integer': 'customer_id must be an integer',
      'number.positive': 'customer_id must be a positive number',
      'any.required': 'customer_id is required',
    }),
    type: Joi.string().valid('doctor', 'hospital', 'service', 'speciality', 'clinic', 'pharmacy').required().messages({
      'string.base': 'type must be a string',
      'any.only': 'type must be one of: doctor, hospital, service, speciality',
      'any.required': 'type is required',
    }),
    reference_id: Joi.number().integer().positive().required().messages({
      'number.base': 'reference_id must be a number',
      'number.integer': 'reference_id must be an integer',
      'number.positive': 'reference_id must be a positive number',
      'any.required': 'reference_id is required',
    }),
  }),

  createLeadValidator: Joi.object({
    lead_type: Joi.string()
      .valid("individual", "family", "group")
      .default("individual"),

    members: Joi.array()
      .items(Joi.string().valid(
        "self", "wife", "husband", "spouse",
        "son", "daughter",
        "father", "mother",
        "father_in_law", "mother_in_law",
        "grandmother", "grandfather"
      ))
      .min(1)
      .required(),

    family_details: Joi.array().items(
      Joi.object({
        type: Joi.string().required(),
        age: Joi.number().integer().min(0).max(120).required()
      })
    ).required(),

    city: Joi.string().required(),

    surgical_history: Joi.boolean().required(),

    medical_history: Joi.array().items(Joi.string()).default([]),

    phone: Joi.string().required(),

    email: Joi.string().email().optional()
  }),

  // paymentValidator: Joi.object().keys({
  //   amount: Joi.number().positive().required().messages({
  //     'number.base': 'Amount must be a number.',
  //     'number.positive': 'Amount must be greater than zero.',
  //     'any.required': 'Amount is required.',
  //   }),
  //   currency: Joi.string().valid('aed').optional().default('aed').messages({
  //     'any.only': 'Currency must be AED for this region.',
  //     }),
  //   source: Joi.string().required().messages({
  //     'any.required': 'Payment source (Stripe token) is required.',
  //   }),
  //   includeVat: Joi.boolean().optional().default(true).messages({
  //     'boolean.base': 'includeVat must be a boolean.',
  //   }),
  //   customer_id: Joi.number().integer().required().messages({
  //     'number.base': 'Customer ID must be a number.',
  //     'number.integer': 'Customer ID must be an integer.',
  //     'any.required': 'Customer ID is required.',
  //   }),
  // }),
};