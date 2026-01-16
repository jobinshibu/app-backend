import httpStatus from 'http-status';
import APIResponse from '../utils/APIResponse.js';
import enums from '../utils/utils.js';
import { getJWTToken } from '../utils/jwt.helper.js';
import CommonService from '../services/common.js';
import CryptoJS from 'crypto-js';
import HotelBookingServices from '../services/booking.js';
import HotelDetailsServices from '../services/hotel.js';
import { Op } from 'sequelize';
import axios from 'axios';
import moment from 'moment';
import FormData from 'form-data';
import SendSmsController from './SendSmsController.js';
import SendEmailController from './SendEmailController.js';
import ShiftPaymentController from './ShiftPaymentController.js';
import {
  allowLegacyRenegotiationforNodeJsOptions,
  getShiftDateTime,
  getTaxExemptionIdsOnBookings
} from '../utils/helper.js';

class CommonController {}

export default new CommonController();
